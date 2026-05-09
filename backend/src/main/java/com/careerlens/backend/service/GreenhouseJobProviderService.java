package com.careerlens.backend.service;

import com.careerlens.backend.dto.ExternalJobImportRequestDto;
import com.careerlens.backend.dto.ExternalJobImportResponseDto;
import com.careerlens.backend.dto.ExternalJobPreviewDto;
import com.careerlens.backend.dto.JobPostingDto;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PatternProfile;
import com.careerlens.backend.repository.JobPostingRepository;
import com.careerlens.backend.repository.PatternProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GreenhouseJobProviderService {

    private static final Pattern BOARD_TOKEN_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{2,80}$");
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]+>");
    private static final Pattern SPACE_PATTERN = Pattern.compile("\\s+");
    private static final Pattern EXPERIENCE_PATTERN = Pattern.compile("(\\d+)\\+?\\s*(?:years|yrs|year)", Pattern.CASE_INSENSITIVE);
    private static final Pattern SALARY_PATTERN = Pattern.compile("\\$\\s?[0-9][0-9,]*(?:k|K)?\\s*(?:-|to|~)\\s*\\$?\\s?[0-9][0-9,]*(?:k|K)?", Pattern.CASE_INSENSITIVE);

    private final ObjectMapper objectMapper;
    private final JobPostingRepository jobPostingRepository;
    private final PatternProfileRepository patternProfileRepository;
    private final JobPostingService jobPostingService;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String baseUrl;
    private final int timeoutSeconds;

    public GreenhouseJobProviderService(
            ObjectMapper objectMapper,
            JobPostingRepository jobPostingRepository,
            PatternProfileRepository patternProfileRepository,
            JobPostingService jobPostingService,
            @Value("${app.external-jobs.greenhouse.enabled:true}") boolean enabled,
            @Value("${app.external-jobs.greenhouse.base-url:https://boards-api.greenhouse.io}") String baseUrl,
            @Value("${app.external-jobs.greenhouse.timeout-seconds:12}") int timeoutSeconds
    ) {
        this.objectMapper = objectMapper;
        this.jobPostingRepository = jobPostingRepository;
        this.patternProfileRepository = patternProfileRepository;
        this.jobPostingService = jobPostingService;
        this.enabled = enabled;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.timeoutSeconds = timeoutSeconds;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(Math.max(3, timeoutSeconds)))
                .build();
    }

    @Transactional(readOnly = true)
    public List<ExternalJobPreviewDto> preview(String boardToken, String defaultCountry, String defaultJobFamily, Integer limit) {
        List<ExternalJobPreviewDto> previews = fetchPreviews(boardToken, defaultCountry, defaultJobFamily, limit);
        List<ExternalJobPreviewDto> marked = new ArrayList<>();
        for (ExternalJobPreviewDto preview : previews) {
            marked.add(withImportedFlag(preview, jobPostingRepository.findByExternalRef(preview.externalRef()).isPresent()));
        }
        return marked;
    }

    @Transactional
    public ExternalJobImportResponseDto importJobs(ExternalJobImportRequestDto request) {
        boolean createPatterns = request.createPatternProfile() == null || request.createPatternProfile();
        List<ExternalJobPreviewDto> previews = fetchPreviews(
                request.boardToken(),
                request.defaultCountry(),
                request.defaultJobFamily(),
                request.limit()
        );

        int imported = 0;
        int updated = 0;
        List<JobPostingDto> savedJobs = new ArrayList<>();
        for (ExternalJobPreviewDto preview : previews) {
            boolean exists = jobPostingRepository.findByExternalRef(preview.externalRef()).isPresent();
            JobPosting job = jobPostingRepository.findByExternalRef(preview.externalRef()).orElseGet(JobPosting::new);
            applyPreview(job, preview, request);
            JobPosting saved = jobPostingRepository.save(job);
            if (createPatterns) {
                upsertImportedPattern(saved, preview);
            }
            savedJobs.add(jobPostingService.toDto(saved));
            if (exists) {
                updated++;
            } else {
                imported++;
            }
        }

        return new ExternalJobImportResponseDto(
                "greenhouse",
                normalizeBoardToken(request.boardToken()),
                previews.size(),
                imported,
                updated,
                savedJobs
        );
    }

    private List<ExternalJobPreviewDto> fetchPreviews(String rawBoardToken, String defaultCountry, String defaultJobFamily, Integer limit) {
        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Greenhouse provider is disabled.");
        }

        String boardToken = normalizeBoardToken(rawBoardToken);
        String companyName = fetchBoardName(boardToken);
        JsonNode root = requestJson(boardToken, "/v1/boards/" + boardToken + "/jobs?content=true");
        JsonNode jobs = root.path("jobs");
        if (!jobs.isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Greenhouse jobs response does not contain a jobs array.");
        }

        int max = limit == null || limit <= 0 ? 20 : Math.min(limit, 50);
        List<ExternalJobPreviewDto> previews = new ArrayList<>();
        for (JsonNode job : jobs) {
            if (previews.size() >= max) {
                break;
            }
            ExternalJobPreviewDto preview = toPreview(boardToken, companyName, job, defaultCountry, defaultJobFamily);
            if (preview != null) {
                previews.add(preview);
            }
        }
        return previews;
    }

    private String fetchBoardName(String boardToken) {
        try {
            JsonNode root = requestJson(boardToken, "/v1/boards/" + boardToken);
            String name = text(root.path("name"));
            return name.isBlank() ? humanizeBoardToken(boardToken) : name;
        } catch (ResponseStatusException exception) {
            return humanizeBoardToken(boardToken);
        }
    }

    private JsonNode requestJson(String boardToken, String path) {
        String uri = baseUrl + path;
        HttpRequest request = HttpRequest.newBuilder(URI.create(uri))
                .timeout(Duration.ofSeconds(Math.max(3, timeoutSeconds)))
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Greenhouse board token not found: " + boardToken);
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Greenhouse API returned status " + response.statusCode());
            }
            return objectMapper.readTree(response.body());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to parse Greenhouse API response.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Greenhouse API request was interrupted.");
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Greenhouse API request path.");
        }
    }

    private ExternalJobPreviewDto toPreview(String boardToken, String companyName, JsonNode job, String defaultCountry, String defaultJobFamily) {
        String jobId = text(job.path("id"));
        String title = text(job.path("title"));
        String content = stripHtml(text(job.path("content")));
        String location = locationFor(job);
        String department = departmentFor(job);
        String sourceUrl = text(job.path("absolute_url"));
        String textForAnalysis = (title + " " + content + " " + location).toLowerCase(Locale.ROOT);
        String classificationText = (title + " " + department).toLowerCase(Locale.ROOT);
        String country = fallback(inferCountry(location), defaultCountry, "United States");
        if (isExcludedNonEngineeringPosting(classificationText)) {
            return null;
        }
        String inferredJobFamily = inferJobFamily(classificationText);
        if (inferredJobFamily.isBlank() && isRelevantEngineeringPosting(classificationText)) {
            inferredJobFamily = "Backend";
        }
        if (inferredJobFamily.isBlank()) {
            return null;
        }
        String jobFamily = fallback(inferredJobFamily, defaultJobFamily, "Backend");
        List<String> requiredSkills = extractSkills(textForAnalysis, jobFamily, true);
        List<String> preferredSkills = extractSkills(textForAnalysis, jobFamily, false);
        List<String> languages = extractLanguages(textForAnalysis, country);

        return new ExternalJobPreviewDto(
                "greenhouse",
                boardToken,
                "greenhouse:" + boardToken + ":" + jobId,
                companyName,
                country,
                title,
                jobFamily,
                location,
                sourceUrl,
                requiredSkills,
                preferredSkills,
                languages,
                inferExperienceYears(textForAnalysis),
                inferDegree(textForAnalysis),
                textForAnalysis.contains("portfolio"),
                inferVisaRequirement(textForAnalysis),
                inferSalaryRange(content),
                inferWorkType(textForAnalysis),
                summarize(content),
                false
        );
    }

    private void applyPreview(JobPosting job, ExternalJobPreviewDto preview, ExternalJobImportRequestDto request) {
        job.setExternalRef(preview.externalRef());
        job.setCompanyName(preview.companyName());
        job.setCountry(preview.country());
        job.setJobTitle(preview.jobTitle());
        job.setJobFamily(preview.jobFamily());
        job.setRequiredSkills(preview.requiredSkills());
        job.setPreferredSkills(preview.preferredSkills());
        job.setRequiredLanguages(preview.requiredLanguages());
        job.setMinExperienceYears(preview.minExperienceYears());
        job.setDegreeRequirement(preview.degreeRequirement());
        job.setPortfolioRequired(preview.portfolioRequired());
        job.setVisaRequirement(preview.visaRequirement());
        job.setSalaryRange(preview.salaryRange());
        job.setWorkType(preview.workType());
        job.setApplicationDeadline(request.defaultDeadline());
        job.setSalaryScore(scoreSalary(preview.salaryRange()));
        job.setWorkLifeBalanceScore(scoreWorkLife(preview.workType()));
        job.setCompanyValueScore(72);
        job.setProbabilityWeight(30);
        job.setSalaryWeight(15);
        job.setWorkLifeBalanceWeight(15);
        job.setCompanyValueWeight(15);
        job.setJobFitWeight(25);
        job.setEvaluationRationale("Greenhouse 공개 Job Board API에서 가져온 공고를 CareerLens 내부 JobPosting 형식으로 정규화했습니다. 직원 표본/패턴 데이터는 별도 검수 또는 자동 생성 후보로 보강해야 합니다.");
    }

    private void upsertImportedPattern(JobPosting job, ExternalJobPreviewDto preview) {
        String patternRef = "greenhouse-pattern:" + preview.boardToken() + ":" + job.getId();
        PatternProfile pattern = patternProfileRepository.findByPatternRef(patternRef).orElseGet(PatternProfile::new);
        pattern.setPatternRef(patternRef);
        pattern.setJobPosting(job);
        pattern.setPatternTitle(preview.companyName() + " " + preview.jobFamily() + " 공개 공고 기반 기본 패턴");
        pattern.setJobFamily(preview.jobFamily());
        pattern.setTargetExperienceYears(preview.minExperienceYears() == null ? 2 : preview.minExperienceYears());
        pattern.setLanguageBenchmark(languageBenchmark(preview.requiredLanguages()));
        pattern.setEducationBenchmark(preview.degreeRequirement());
        pattern.setGithubExpected(true);
        pattern.setPortfolioExpected(preview.portfolioRequired());
        pattern.setProjectExperienceBenchmark(projectBenchmark(preview));
        pattern.setEvidenceSummary("Greenhouse 공개 공고의 직무명, 본문, 위치, 기술 키워드를 기반으로 생성한 기본 PatternProfile입니다. 실제 서비스에서는 직원 표본과 가상 합격자 패턴 검수를 거쳐 보강합니다.");
        pattern.setCoreSkills(preview.requiredSkills());
        pattern.setPreferredSkills(preview.preferredSkills());
        pattern.setCertifications(new ArrayList<>());
        patternProfileRepository.save(pattern);
    }

    private ExternalJobPreviewDto withImportedFlag(ExternalJobPreviewDto preview, boolean imported) {
        return new ExternalJobPreviewDto(
                preview.provider(),
                preview.boardToken(),
                preview.externalRef(),
                preview.companyName(),
                preview.country(),
                preview.jobTitle(),
                preview.jobFamily(),
                preview.location(),
                preview.sourceUrl(),
                new ArrayList<>(preview.requiredSkills()),
                new ArrayList<>(preview.preferredSkills()),
                new ArrayList<>(preview.requiredLanguages()),
                preview.minExperienceYears(),
                preview.degreeRequirement(),
                preview.portfolioRequired(),
                preview.visaRequirement(),
                preview.salaryRange(),
                preview.workType(),
                preview.contentSummary(),
                imported
        );
    }

    private String normalizeBoardToken(String rawBoardToken) {
        String boardToken = rawBoardToken == null ? "" : rawBoardToken.trim();
        if (!BOARD_TOKEN_PATTERN.matcher(boardToken).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Greenhouse board token must contain only letters, numbers, underscore, or hyphen.");
        }
        return boardToken;
    }

    private String locationFor(JsonNode job) {
        String location = text(job.path("location").path("name"));
        if (!location.isBlank()) {
            return location;
        }
        JsonNode offices = job.path("offices");
        if (offices.isArray()) {
            for (JsonNode office : offices) {
                String officeLocation = text(office.path("location"));
                if (!officeLocation.isBlank()) {
                    return officeLocation;
                }
                String officeName = text(office.path("name"));
                if (!officeName.isBlank()) {
                    return officeName;
                }
            }
        }
        return "Remote / Not specified";
    }

    private String departmentFor(JsonNode job) {
        JsonNode departments = job.path("departments");
        if (!departments.isArray()) {
            return "";
        }
        List<String> names = new ArrayList<>();
        for (JsonNode department : departments) {
            String name = text(department.path("name"));
            if (!name.isBlank()) {
                names.add(name);
            }
        }
        return String.join(" ", names);
    }

    private List<String> extractSkills(String text, String jobFamily, boolean core) {
        List<String> candidates = new ArrayList<>();
        addSkillCandidates(candidates);
        Set<String> found = new LinkedHashSet<>();
        for (String skill : candidates) {
            if (text.contains(skill.toLowerCase(Locale.ROOT))) {
                found.add(skill);
            }
        }
        if (found.isEmpty()) {
            if ("Frontend".equalsIgnoreCase(jobFamily)) {
                found.add("TypeScript");
                found.add("React");
                found.add("Next.js");
            } else if ("AI/ML".equalsIgnoreCase(jobFamily)) {
                found.add("Python");
                found.add("Machine Learning");
                found.add("PyTorch");
            } else if ("Data".equalsIgnoreCase(jobFamily)) {
                found.add("Python");
                found.add("SQL");
                found.add("Data Pipeline");
            } else {
                found.add("Java");
                found.add("Spring Boot");
                found.add("API");
            }
        }

        List<String> values = new ArrayList<>(found);
        int fromIndex = core ? 0 : Math.min(4, values.size());
        int toIndex = core ? Math.min(5, values.size()) : Math.min(values.size(), fromIndex + 5);
        if (fromIndex >= toIndex) {
            return new ArrayList<>();
        }
        return new ArrayList<>(values.subList(fromIndex, toIndex));
    }

    private void addSkillCandidates(List<String> candidates) {
        candidates.add("Java");
        candidates.add("Spring Boot");
        candidates.add("Kotlin");
        candidates.add("Python");
        candidates.add("Go");
        candidates.add("Node.js");
        candidates.add("TypeScript");
        candidates.add("JavaScript");
        candidates.add("React");
        candidates.add("Next.js");
        candidates.add("Vue");
        candidates.add("AWS");
        candidates.add("GCP");
        candidates.add("Docker");
        candidates.add("Kubernetes");
        candidates.add("MySQL");
        candidates.add("PostgreSQL");
        candidates.add("Redis");
        candidates.add("GraphQL");
        candidates.add("REST API");
        candidates.add("API");
        candidates.add("Distributed Systems");
        candidates.add("Machine Learning");
        candidates.add("PyTorch");
        candidates.add("TensorFlow");
        candidates.add("LLM");
        candidates.add("MLOps");
        candidates.add("SQL");
        candidates.add("Spark");
        candidates.add("Data Pipeline");
        candidates.add("CI/CD");
    }

    private List<String> extractLanguages(String text, String country) {
        Set<String> languages = new LinkedHashSet<>();
        if (text.contains("japanese") || "Japan".equalsIgnoreCase(country)) {
            languages.add("Japanese Business");
        }
        if (text.contains("english") || languages.isEmpty()) {
            languages.add("English Business");
        }
        return new ArrayList<>(languages);
    }

    private Integer inferExperienceYears(String text) {
        Matcher matcher = EXPERIENCE_PATTERN.matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        if (text.contains("principal") || text.contains("staff")) {
            return 7;
        }
        if (text.contains("senior")) {
            return 5;
        }
        if (text.contains("junior") || text.contains("entry")) {
            return 1;
        }
        return 2;
    }

    private String inferCountry(String location) {
        String normalized = location.toLowerCase(Locale.ROOT);
        if (normalized.contains("south korea") || normalized.contains("korea") || normalized.contains("seoul")) {
            return "South Korea";
        }
        if (normalized.contains("singapore")) {
            return "Singapore";
        }
        if (normalized.contains("italy") || normalized.contains("milan")) {
            return "Italy";
        }
        if (normalized.contains("united kingdom") || normalized.contains("uk") || normalized.contains("london")) {
            return "United Kingdom";
        }
        if (normalized.contains("canada") || normalized.contains("toronto") || normalized.contains("vancouver")) {
            return "Canada";
        }
        if (normalized.contains("australia") || normalized.contains("sydney") || normalized.contains("melbourne")) {
            return "Australia";
        }
        if (normalized.contains("japan") || normalized.contains("tokyo") || normalized.contains("osaka")) {
            return "Japan";
        }
        if (normalized.contains("united states") || normalized.contains("usa") || normalized.contains("new york")
                || normalized.contains("san francisco") || normalized.contains("seattle") || normalized.contains("california")) {
            return "United States";
        }
        return "";
    }

    private String inferJobFamily(String text) {
        if (text.contains("machine learning") || text.contains(" ai ") || text.contains("artificial intelligence")
                || text.contains("ml engineer") || text.contains("llm") || text.contains("deep learning")
                || text.contains("pytorch") || text.contains("tensorflow") || text.contains("model training")) {
            return "AI/ML";
        }
        if (text.contains("data engineer") || text.contains("analytics engineer") || text.contains("data platform")
                || text.contains("warehouse") || text.contains("etl") || text.contains("spark")) {
            return "Data";
        }
        if (text.contains("frontend") || text.contains("front-end") || text.contains("react") || text.contains("ui engineer")) {
            return "Frontend";
        }
        if (text.contains("backend") || text.contains("back-end") || text.contains("platform") || text.contains("infrastructure")
                || text.contains("distributed systems") || text.contains("api")) {
            return "Backend";
        }
        return "";
    }

    private boolean isRelevantEngineeringPosting(String text) {
        return text.contains("software engineer")
                || text.contains("software engineering")
                || text.contains("backend engineer")
                || text.contains("frontend engineer")
                || text.contains("full stack engineer")
                || text.contains("platform engineer")
                || text.contains("infrastructure engineer")
                || text.contains("data engineer")
                || text.contains("machine learning engineer")
                || text.contains("ml engineer")
                || text.contains("developer")
                || text.contains("swe")
                || text.contains("backend")
                || text.contains("frontend")
                || text.contains("full stack")
                || text.contains("platform")
                || text.contains("infrastructure");
    }

    private boolean isExcludedNonEngineeringPosting(String text) {
        return text.contains("policy")
                || text.contains("business operations")
                || text.contains("operations lead")
                || text.contains("strategic finance")
                || text.contains("finance")
                || text.contains("legal")
                || text.contains("recruit")
                || text.contains("talent")
                || text.contains("marketing")
                || text.contains("sales")
                || text.contains("product manager")
                || text.contains("program manager")
                || text.contains("community support")
                || text.contains("customer support")
                || text.contains("trust & safety");
    }

    private String inferDegree(String text) {
        if (text.contains("bachelor") || text.contains("bs degree") || text.contains("computer science")) {
            return "Bachelor preferred";
        }
        if (text.contains("master")) {
            return "Master preferred";
        }
        return "Degree not explicitly required";
    }

    private String inferVisaRequirement(String text) {
        if (text.contains("visa sponsorship") || text.contains("sponsorship")) {
            return "Visa sponsorship mentioned";
        }
        return "Not specified in public posting";
    }

    private String inferSalaryRange(String content) {
        Matcher matcher = SALARY_PATTERN.matcher(content);
        return matcher.find() ? matcher.group().replaceAll("\\s+", "") : "Not disclosed";
    }

    private String inferWorkType(String text) {
        if (text.contains("remote")) {
            return "Remote";
        }
        if (text.contains("hybrid")) {
            return "Hybrid";
        }
        return "On-site / Not specified";
    }

    private int scoreSalary(String salaryRange) {
        return salaryRange == null || salaryRange.equals("Not disclosed") ? 60 : 78;
    }

    private int scoreWorkLife(String workType) {
        if (workType == null) {
            return 60;
        }
        if (workType.contains("Remote")) {
            return 78;
        }
        if (workType.contains("Hybrid")) {
            return 72;
        }
        return 62;
    }

    private String languageBenchmark(List<String> languages) {
        if (languages == null || languages.isEmpty()) {
            return "English Business";
        }
        return String.join(", ", languages);
    }

    private String projectBenchmark(ExternalJobPreviewDto preview) {
        return preview.jobFamily() + " 직무 공고의 핵심 기술을 사용한 실무형 프로젝트 1개 이상, README와 API/화면 설계 근거 제출";
    }

    private String summarize(String content) {
        String normalized = SPACE_PATTERN.matcher(content == null ? "" : content.trim()).replaceAll(" ");
        if (normalized.length() <= 260) {
            return normalized;
        }
        return normalized.substring(0, 260) + "...";
    }

    private String stripHtml(String value) {
        String unescaped = HtmlUtils.htmlUnescape(value == null ? "" : value);
        String withoutTags = HTML_TAG_PATTERN.matcher(unescaped).replaceAll(" ");
        return SPACE_PATTERN.matcher(withoutTags.replace("&nbsp;", " ")).replaceAll(" ").trim();
    }

    private String text(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return "";
        }
        return node.asText("");
    }

    private String fallback(String primary, String secondary, String defaultValue) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (secondary != null && !secondary.isBlank()) {
            return secondary.trim();
        }
        return defaultValue;
    }

    private String humanizeBoardToken(String boardToken) {
        if (boardToken == null || boardToken.isBlank()) {
            return "Greenhouse Company";
        }
        String normalized = boardToken.replace('-', ' ').replace('_', ' ');
        return normalized.substring(0, 1).toUpperCase(Locale.ROOT) + normalized.substring(1);
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://boards-api.greenhouse.io";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
