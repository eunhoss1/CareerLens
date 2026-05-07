package com.careerlens.backend.service;

import com.careerlens.backend.dto.DocumentVerificationRequestDto;
import com.careerlens.backend.dto.GithubVerificationRequestDto;
import com.careerlens.backend.dto.VerificationBadgeDto;
import com.careerlens.backend.dto.VerificationRequestDto;
import com.careerlens.backend.entity.PlannerTask;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.VerificationBadge;
import com.careerlens.backend.entity.VerificationRequest;
import com.careerlens.backend.repository.PlannerTaskRepository;
import com.careerlens.backend.repository.VerificationBadgeRepository;
import com.careerlens.backend.repository.VerificationRequestRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VerificationService {

    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String MODE_RULE_BASED = "RULE_BASED";
    private static final String MODE_AI_ASSISTED = "AI_ASSISTED";
    private static final Pattern GITHUB_REPO_PATTERN = Pattern.compile(
            "^https://(?:www\\.)?github\\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)(?:\\.git)?/?(?:.*)?$"
    );

    private final PlannerTaskRepository plannerTaskRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final VerificationBadgeRepository verificationBadgeRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean aiEnabled;
    private final String provider;
    private final String apiKey;
    private final String model;
    private final String responsesUrl;

    public VerificationService(
            PlannerTaskRepository plannerTaskRepository,
            VerificationRequestRepository verificationRequestRepository,
            VerificationBadgeRepository verificationBadgeRepository,
            ObjectMapper objectMapper,
            @Value("${app.ai.openai.enabled:false}") boolean aiEnabled,
            @Value("${app.ai.provider:openai}") String provider,
            @Value("${app.ai.openai.api-key:}") String openAiApiKey,
            @Value("${app.ai.openai.model:gpt-5.4}") String openAiModel,
            @Value("${app.ai.openai.responses-url:https://api.openai.com/v1/responses}") String openAiResponsesUrl,
            @Value("${app.ai.groq.api-key:}") String groqApiKey,
            @Value("${app.ai.groq.model:openai/gpt-oss-20b}") String groqModel,
            @Value("${app.ai.groq.responses-url:https://api.groq.com/openai/v1/responses}") String groqResponsesUrl
    ) {
        this.plannerTaskRepository = plannerTaskRepository;
        this.verificationRequestRepository = verificationRequestRepository;
        this.verificationBadgeRepository = verificationBadgeRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        this.aiEnabled = aiEnabled;
        this.provider = provider == null ? "openai" : provider.trim().toLowerCase(Locale.ROOT);
        if ("groq".equals(this.provider)) {
            this.apiKey = groqApiKey;
            this.model = groqModel;
            this.responsesUrl = groqResponsesUrl;
        } else {
            this.apiKey = openAiApiKey;
            this.model = openAiModel;
            this.responsesUrl = openAiResponsesUrl;
        }
    }

    @Transactional
    public VerificationRequestDto verifyTaskText(Long taskId, DocumentVerificationRequestDto request) {
        PlannerTask task = findTask(taskId);
        AnalysisDraft analysis = analyze(task, request.submittedText(), "TEXT_DOCUMENT");
        VerificationRequest verification = saveVerification(
                task,
                blank(request.documentType()) ? "TEXT_DOCUMENT" : request.documentType(),
                request.submittedText(),
                analysis
        );
        issueBadges(verification);
        return toDto(verification);
    }

    @Transactional
    public VerificationRequestDto verifyTaskGithub(Long taskId, GithubVerificationRequestDto request) {
        PlannerTask task = findTask(taskId);
        GithubRepo repo = parseGithubRepo(request.githubUrl());
        GithubRepoContext context = fetchGithubContext(repo);
        String submittedText = """
                GitHub repository: %s
                Owner: %s
                Repository: %s
                Fetch status: %s
                Description: %s
                Primary language: %s
                Stars: %s
                Forks: %s
                Default branch: %s
                README excerpt:
                %s

                User note:
                %s
                """.formatted(
                repo.normalizedUrl(),
                repo.owner(),
                repo.name(),
                context.fetchStatus(),
                safe(context.description()),
                safe(context.language()),
                context.stars(),
                context.forks(),
                safe(context.defaultBranch()),
                safe(context.readmeExcerpt()),
                safe(request.note())
        );
        AnalysisDraft analysis = analyze(task, submittedText, "GITHUB_REPOSITORY");
        VerificationRequest verification = saveVerification(task, "GITHUB_REPOSITORY", submittedText, analysis);
        issueBadges(verification);
        return toDto(verification);
    }

    @Transactional
    public VerificationRequestDto verifyTaskFile(Long taskId, String documentType, MultipartFile file) {
        PlannerTask task = findTask(taskId);
        String extractedText = extractText(file);
        if (extractedText.isBlank()) {
            throw new IllegalArgumentException("PDF/DOCX file has no readable text.");
        }
        String requestType = blank(documentType) ? documentTypeFromFilename(file.getOriginalFilename()) : documentType;
        AnalysisDraft analysis = analyze(task, extractedText, requestType);
        VerificationRequest verification = saveVerification(task, requestType, extractedText, analysis);
        issueBadges(verification);
        return toDto(verification);
    }

    @Transactional(readOnly = true)
    public List<VerificationRequestDto> getTaskVerifications(Long taskId) {
        return verificationRequestRepository.findByPlannerTaskIdOrderByRequestedAtDesc(taskId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VerificationBadgeDto> getUserBadges(Long userId) {
        return verificationBadgeRepository.findByUserIdOrderByIssuedAtDesc(userId).stream()
                .map(this::toBadgeDto)
                .toList();
    }

    private PlannerTask findTask(Long taskId) {
        return plannerTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Planner task not found: " + taskId));
    }

    private VerificationRequest saveVerification(PlannerTask task, String requestType, String submittedText, AnalysisDraft analysis) {
        User user = task.getRoadmap().getUser();
        VerificationRequest verification = new VerificationRequest();
        verification.setUser(user);
        verification.setPlannerTask(task);
        verification.setRequestType(requestType);
        verification.setStatus(STATUS_COMPLETED);
        verification.setSubmittedText(limit(submittedText, 1000));
        verification.setVerificationScore(analysis.score());
        verification.setAnalysisSummary(analysis.summary());
        verification.setStrengths(String.join("; ", analysis.strengths()));
        verification.setImprovementItems(String.join("; ", analysis.improvementItems()));
        verification.setReviewerMode(analysis.mode());
        verification.setRequestedAt(LocalDateTime.now());
        verification.setCompletedAt(LocalDateTime.now());
        return verificationRequestRepository.save(verification);
    }

    private void issueBadges(VerificationRequest verification) {
        Integer score = verification.getVerificationScore();
        if (score == null || score < 60) {
            return;
        }

        BadgeSpec tierBadge = tierBadge(score);
        saveBadgeIfAbsent(verification, tierBadge);

        if ("GITHUB_REPOSITORY".equals(verification.getRequestType()) && score >= 75) {
            saveBadgeIfAbsent(verification, new BadgeSpec(
                    "GITHUB_PROJECT_VERIFIED",
                    "GitHub 프로젝트 검증",
                    "실제 GitHub repository URL과 과제 기준을 함께 검증해 발급된 배지입니다."
            ));
        }
    }

    private BadgeSpec tierBadge(int score) {
        if (score >= 90) {
            return new BadgeSpec("TASK_VERIFIED_GOLD", "Gold 검증", "과제 산출물이 기대 산출물과 검증 기준을 매우 충실히 만족했습니다.");
        }
        if (score >= 75) {
            return new BadgeSpec("TASK_VERIFIED_SILVER", "Silver 검증", "과제 산출물이 주요 검증 기준을 대체로 만족했습니다.");
        }
        return new BadgeSpec("TASK_VERIFIED_BRONZE", "Bronze 검증", "과제 산출물이 기본 검증 기준을 일부 만족했습니다.");
    }

    private void saveBadgeIfAbsent(VerificationRequest verification, BadgeSpec spec) {
        if (verification.getId() != null
                && verificationBadgeRepository.findByVerificationRequestIdAndBadgeType(verification.getId(), spec.type()).isPresent()) {
            return;
        }
        VerificationBadge badge = new VerificationBadge();
        badge.setUser(verification.getUser());
        badge.setPlannerTask(verification.getPlannerTask());
        badge.setVerificationRequest(verification);
        badge.setBadgeType(spec.type());
        badge.setLabel(spec.label());
        badge.setDescription(spec.description());
        badge.setScoreAtIssue(verification.getVerificationScore());
        badge.setIssuedAt(LocalDateTime.now());
        verificationBadgeRepository.save(badge);
    }

    private AnalysisDraft analyze(PlannerTask task, String submittedText, String requestType) {
        AnalysisDraft fallback = ruleBasedAnalysis(task, submittedText, requestType);
        if (!isAiConfigured()) {
            return fallback;
        }
        try {
            AnalysisDraft aiDraft = requestAiAnalysis(task, submittedText, requestType);
            if (aiDraft.summary().isBlank() || aiDraft.improvementItems().isEmpty()) {
                return fallback;
            }
            return aiDraft;
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    private AnalysisDraft requestAiAnalysis(PlannerTask task, String submittedText, String requestType) {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("model", model);
        request.put("temperature", 0.2);
        request.put("max_output_tokens", 1800);
        request.put("input", buildPrompt(task, submittedText, requestType));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(responsesUrl))
                .timeout(Duration.ofSeconds(40))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(request.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI verification request failed: " + response.statusCode());
            }
            String outputText = extractOutputText(objectMapper.readTree(response.body()));
            JsonNode root = objectMapper.readTree(cleanJson(outputText));
            return new AnalysisDraft(
                    clamp(root.path("score").asInt(60)),
                    root.path("summary").asText("제출 내용이 과제 기준과 일부 연결되어 있습니다."),
                    jsonArray(root.path("strengths")),
                    jsonArray(root.path("improvement_items")),
                    MODE_AI_ASSISTED + ":" + provider.toUpperCase(Locale.ROOT)
            );
        } catch (IOException exception) {
            throw new IllegalStateException("AI verification response parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI verification request interrupted", exception);
        }
    }

    private String buildPrompt(PlannerTask task, String submittedText, String requestType) {
        return """
                당신은 CareerLens의 해외취업 과제 검증 리뷰어다.
                사용자가 제출한 텍스트, GitHub repository, PDF, DOCX 내용이 플래너 과제의 산출물과 검증 기준을 충족하는지 평가한다.
                합격 보장, 허위 경력 작성, 외부 사실 조사는 하지 않는다.

                반드시 JSON 객체만 반환한다. 마크다운 코드블록을 쓰지 마라.
                스키마:
                {
                  "score": 75,
                  "summary": "3문장 이내 요약",
                  "strengths": ["좋은 점 1", "좋은 점 2"],
                  "improvement_items": ["보완점 1", "보완점 2", "보완점 3"]
                }

                점수 기준:
                - 90 이상: 배지 Gold 수준. 산출물과 검증 기준이 매우 구체적이고 포트폴리오 증빙으로 바로 활용 가능.
                - 75 이상: 배지 Silver 수준. 주요 기준은 충족하지만 일부 보완 필요.
                - 60 이상: 배지 Bronze 수준. 기본 산출물은 있으나 구체성과 검증 가능성이 부족.
                - 60 미만: 배지 미발급. 산출물 기준이 불명확하거나 공고/과제와 연결이 약함.

                제출 유형: %s
                과제 제목: %s
                과제 설명: %s
                기대 산출물: %s
                검증 기준: %s

                제출 내용:
                %s
                """.formatted(
                requestType,
                safe(task.getTitle()),
                safe(task.getDescription()),
                safe(task.getExpectedOutputs()),
                safe(task.getVerificationCriteria()),
                limit(submittedText, 9000)
        );
    }

    private AnalysisDraft ruleBasedAnalysis(PlannerTask task, String submittedText, String requestType) {
        String text = submittedText == null ? "" : submittedText.trim();
        int score = 42;
        if (text.length() >= 1000) {
            score += 18;
        } else if (text.length() >= 500) {
            score += 12;
        } else if (text.length() >= 250) {
            score += 7;
        }
        if (containsAny(text, "github", "repository", "portfolio", "readme", "api", "project", "프로젝트", "성과", "역할")) {
            score += 14;
        }
        if (containsAny(text, keywordTokens(task.getVerificationCriteria()))) {
            score += 14;
        }
        if (containsAny(text, keywordTokens(task.getExpectedOutputs()))) {
            score += 10;
        }
        if ("GITHUB_REPOSITORY".equals(requestType) && containsAny(text, "README excerpt", "Primary language", "Default branch")) {
            score += 10;
        }
        if (requestType != null && requestType.contains("PDF") || requestType != null && requestType.contains("DOCX")) {
            score += 4;
        }
        score = clamp(score);

        List<String> strengths = new ArrayList<>();
        strengths.add("제출 내용이 플래너 과제와 연결되어 있습니다.");
        if (text.length() >= 250) {
            strengths.add("기본 설명 분량은 확보되어 있습니다.");
        }
        if (containsAny(text, "결과", "성과", "화면", "링크", "README", "readme", "repository")) {
            strengths.add("검증 가능한 결과물 또는 증빙을 언급했습니다.");
        }

        List<String> improvements = new ArrayList<>();
        improvements.add("기대 산출물(" + safe(task.getExpectedOutputs()) + ")을 항목별로 더 명확히 분리하세요.");
        improvements.add("검증 기준(" + safe(task.getVerificationCriteria()) + ")을 하나씩 충족했는지 체크 형태로 보강하세요.");
        if (!containsAny(text, "수치", "%", "ms", "명", "개", "건")) {
            improvements.add("성과를 수치나 구체적인 결과로 표현하면 지원서 활용도가 높아집니다.");
        }

        return new AnalysisDraft(
                score,
                "제출 내용은 과제와 일부 연결되어 있으며, 산출물과 검증 기준을 더 명확히 표시하면 포트폴리오 증빙으로 활용하기 좋습니다.",
                strengths,
                improvements,
                MODE_RULE_BASED
        );
    }

    private GithubRepo parseGithubRepo(String url) {
        if (blank(url)) {
            throw new IllegalArgumentException("GitHub repository URL is required.");
        }
        Matcher matcher = GITHUB_REPO_PATTERN.matcher(url.trim());
        if (!matcher.matches()) {
            throw new IllegalArgumentException("GitHub URL must be a repository URL like https://github.com/owner/repository.");
        }
        String owner = matcher.group(1);
        String repo = matcher.group(2).replaceFirst("\\.git$", "");
        if (owner.equalsIgnoreCase("topics") || owner.equalsIgnoreCase("features") || owner.equalsIgnoreCase("orgs")) {
            throw new IllegalArgumentException("GitHub profile, topic, organization landing pages are not accepted. Submit a project repository URL.");
        }
        if (repo.isBlank()) {
            throw new IllegalArgumentException("Submit a project repository URL, not a GitHub profile URL.");
        }
        return new GithubRepo(owner, repo, "https://github.com/" + owner + "/" + repo);
    }

    private GithubRepoContext fetchGithubContext(GithubRepo repo) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/repos/" + repo.owner() + "/" + repo.name()))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/vnd.github+json")
                    .header("User-Agent", "CareerLens-Capstone")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) {
                throw new IllegalArgumentException("Public GitHub repository not found: " + repo.normalizedUrl());
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return GithubRepoContext.failed("GITHUB_API_" + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String readme = fetchReadme(repo);
            return new GithubRepoContext(
                    "FETCHED",
                    root.path("description").asText(""),
                    root.path("language").asText(""),
                    root.path("stargazers_count").asInt(0),
                    root.path("forks_count").asInt(0),
                    root.path("default_branch").asText(""),
                    limit(readme, 2500)
            );
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            return GithubRepoContext.failed("FETCH_FAILED");
        }
    }

    private String fetchReadme(GithubRepo repo) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/repos/" + repo.owner() + "/" + repo.name() + "/readme"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/vnd.github.raw")
                    .header("User-Agent", "CareerLens-Capstone")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 300 ? response.body() : "";
        } catch (Exception exception) {
            return "";
        }
    }

    private String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("PDF or DOCX file is required.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be 5MB or smaller.");
        }
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        try {
            if (filename.endsWith(".pdf")) {
                try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                    return limit(new PDFTextStripper().getText(document), 12000);
                }
            }
            if (filename.endsWith(".docx")) {
                try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
                    StringBuilder builder = new StringBuilder();
                    document.getParagraphs().forEach(paragraph -> builder.append(paragraph.getText()).append('\n'));
                    document.getTables().forEach(table ->
                            table.getRows().forEach(row ->
                                    row.getTableCells().forEach(cell -> builder.append(cell.getText()).append('\n'))));
                    return limit(builder.toString(), 12000);
                }
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Failed to read uploaded file.", exception);
        }
        throw new IllegalArgumentException("Only PDF and DOCX files are supported.");
    }

    private String documentTypeFromFilename(String filename) {
        String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) {
            return "PDF_DOCUMENT";
        }
        if (lower.endsWith(".docx")) {
            return "DOCX_DOCUMENT";
        }
        return "FILE_DOCUMENT";
    }

    private VerificationRequestDto toDto(VerificationRequest verification) {
        Long taskId = verification.getPlannerTask() == null ? null : verification.getPlannerTask().getId();
        Long userId = verification.getUser() == null ? null : verification.getUser().getId();
        List<VerificationBadgeDto> badges = verification.getId() == null
                ? new ArrayList<>()
                : verificationBadgeRepository.findByPlannerTaskIdOrderByIssuedAtDesc(taskId).stream()
                .filter(badge -> badge.getVerificationRequest() != null && badge.getVerificationRequest().getId().equals(verification.getId()))
                .map(this::toBadgeDto)
                .toList();
        return new VerificationRequestDto(
                verification.getId(),
                taskId,
                userId,
                verification.getRequestType(),
                verification.getStatus(),
                verification.getVerificationScore(),
                verification.getAnalysisSummary(),
                verification.getStrengths(),
                verification.getImprovementItems(),
                verification.getReviewerMode(),
                verification.getRequestedAt(),
                verification.getCompletedAt(),
                badges
        );
    }

    private VerificationBadgeDto toBadgeDto(VerificationBadge badge) {
        Long taskId = badge.getPlannerTask() == null ? null : badge.getPlannerTask().getId();
        Long verificationId = badge.getVerificationRequest() == null ? null : badge.getVerificationRequest().getId();
        return new VerificationBadgeDto(
                badge.getId(),
                taskId,
                verificationId,
                badge.getBadgeType(),
                badge.getLabel(),
                badge.getDescription(),
                badge.getScoreAtIssue(),
                badge.getIssuedAt()
        );
    }

    private boolean isAiConfigured() {
        return aiEnabled && apiKey != null && !apiKey.isBlank();
    }

    private String extractOutputText(JsonNode root) {
        JsonNode output = root.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.path("content");
                if (content.isArray()) {
                    for (JsonNode contentItem : content) {
                        String text = contentItem.path("text").asText("");
                        if (!text.isBlank()) {
                            return text;
                        }
                    }
                }
            }
        }
        return root.path("output_text").asText("");
    }

    private String cleanJson(String value) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private List<String> jsonArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (!node.isArray()) {
            return values;
        }
        for (JsonNode item : node) {
            String value = item.asText("");
            if (!value.isBlank()) {
                values.add(value);
            }
        }
        return values;
    }

    private String[] keywordTokens(String value) {
        if (value == null || value.isBlank()) {
            return new String[0];
        }
        return value.replace(";", " ")
                .replace(",", " ")
                .split("\\s+");
    }

    private boolean containsAny(String source, String... values) {
        if (source == null || source.isBlank()) {
            return false;
        }
        String lower = source.toLowerCase(Locale.ROOT);
        for (String value : values) {
            if (value != null && value.length() >= 2 && lower.contains(value.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "미기재" : value;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private record AnalysisDraft(
            Integer score,
            String summary,
            List<String> strengths,
            List<String> improvementItems,
            String mode
    ) {
    }

    private record GithubRepo(String owner, String name, String normalizedUrl) {
    }

    private record GithubRepoContext(
            String fetchStatus,
            String description,
            String language,
            Integer stars,
            Integer forks,
            String defaultBranch,
            String readmeExcerpt
    ) {
        static GithubRepoContext failed(String status) {
            return new GithubRepoContext(status, "", "", 0, 0, "", "");
        }
    }

    private record BadgeSpec(String type, String label, String description) {
    }
}
