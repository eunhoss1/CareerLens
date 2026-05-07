package com.careerlens.backend.service;

import com.careerlens.backend.dto.SettlementChecklistDto;
import com.careerlens.backend.dto.SettlementCountrySummaryDto;
import com.careerlens.backend.dto.SettlementGuidanceDto;
import com.careerlens.backend.entity.SettlementChecklist;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.UserProfile;
import com.careerlens.backend.repository.SettlementChecklistRepository;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
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
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettlementService {

    private static final String STATUS_NOT_STARTED = "NOT_STARTED";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_DONE = "DONE";

    private final SettlementChecklistRepository settlementChecklistRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean aiEnabled;
    private final String provider;
    private final String apiKey;
    private final String model;
    private final String responsesUrl;

    public SettlementService(
            SettlementChecklistRepository settlementChecklistRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
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
        this.settlementChecklistRepository = settlementChecklistRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
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
    public List<SettlementChecklistDto> getUserChecklists(Long userId) {
        if (!settlementChecklistRepository.existsByUserId(userId)) {
            initializeDefaultChecklists(userId);
        }
        return settlementChecklistRepository.findByUserIdOrderByCountryAscSortOrderAsc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    @Transactional
    public SettlementChecklistDto updateStatus(Long itemId, String status) {
        SettlementChecklist checklist = settlementChecklistRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Settlement checklist not found: " + itemId));
        checklist.setStatus(normalizeStatus(status));
        checklist.setUpdatedAt(LocalDateTime.now());
        return toDto(settlementChecklistRepository.save(checklist));
    }

    @Transactional
    public SettlementGuidanceDto generateGuidance(Long userId) {
        if (!settlementChecklistRepository.existsByUserId(userId)) {
            initializeDefaultChecklists(userId);
        }
        List<SettlementChecklist> checklists = settlementChecklistRepository.findByUserIdOrderByCountryAscSortOrderAsc(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        SettlementGuidanceDto fallback = buildRuleBasedGuidance(checklists, profile, "RULE_BASED");
        if (!isAiConfigured()) {
            return fallback;
        }

        try {
            SettlementGuidanceDto aiGuidance = requestAiGuidance(checklists, profile, fallback);
            if (aiGuidance.summary() == null || aiGuidance.summary().isBlank() || aiGuidance.priorityActions().isEmpty()) {
                return fallback;
            }
            return aiGuidance;
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    private void initializeDefaultChecklists(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        List<SettlementChecklist> defaults = new ArrayList<>();
        add(defaults, user, "미국", "비자/행정", "비자 스폰서십 조건 확인", "공고의 visa requirement와 본인의 체류 가능 조건을 비교하고 필요한 증빙을 정리합니다. 최신 비자 판단은 공식기관 자료와 전문가 확인이 필요합니다.", 1);
        add(defaults, user, "미국", "비자/행정", "학력/경력 증빙 영문본 정리", "졸업증명, 성적증명, 경력증명, 추천인 정보를 영문 제출 가능 형태로 정리합니다.", 2);
        add(defaults, user, "미국", "출국 전 준비", "오퍼 이후 출국 일정 초안 작성", "입사 예정일, 비자 처리 예상 기간, 항공권/숙소 예약 시점을 역산해 4~8주 일정으로 정리합니다.", 3);
        add(defaults, user, "미국", "초기 정착", "도착 후 생활 기반 체크", "임시 숙소, 은행 계좌, 휴대폰, 의료보험 등 초기 정착 항목을 확인합니다.", 4);
        add(defaults, user, "일본", "비자/행정", "재류자격 및 회사 제출 서류 확인", "내정 후 필요한 재류자격, 학력/경력 증빙, 회사 제출 서류를 점검합니다. 최신 절차는 공식기관 기준으로 재확인합니다.", 5);
        add(defaults, user, "일본", "출국 전 준비", "일본어 증빙과 생활 서류 정리", "JLPT/비즈니스 일본어 증빙, 계약 관련 서류, 입사 전 제출 서류 준비 계획을 세웁니다.", 6);
        add(defaults, user, "일본", "초기 정착", "거주지와 행정 등록 준비", "주소 등록, 은행, 통신, 건강보험 등 입국 후 행정 절차를 체크합니다.", 7);
        add(defaults, user, "일본", "초기 정착", "초기 생활 비용과 이동 동선 정리", "초기 월세, 보증금, 교통, 통신, 생활비를 예산표로 정리하고 첫 2주 이동 동선을 기록합니다.", 8);
        settlementChecklistRepository.saveAll(defaults);
    }

    private void add(
            List<SettlementChecklist> checklists,
            User user,
            String country,
            String category,
            String title,
            String description,
            int sortOrder
    ) {
        LocalDateTime now = LocalDateTime.now();
        SettlementChecklist checklist = new SettlementChecklist();
        checklist.setUser(user);
        checklist.setCountry(country);
        checklist.setCategory(category);
        checklist.setChecklistTitle(title);
        checklist.setDescription(description);
        checklist.setStatus(STATUS_NOT_STARTED);
        checklist.setSortOrder(sortOrder);
        checklist.setCreatedAt(now);
        checklist.setUpdatedAt(now);
        checklists.add(checklist);
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (STATUS_NOT_STARTED.equals(normalized) || STATUS_IN_PROGRESS.equals(normalized) || STATUS_DONE.equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("Unsupported settlement checklist status: " + status);
    }

    private SettlementChecklistDto toDto(SettlementChecklist checklist) {
        return new SettlementChecklistDto(
                checklist.getId(),
                checklist.getUser().getId(),
                checklist.getCountry(),
                checklist.getCategory(),
                checklist.getChecklistTitle(),
                checklist.getDescription(),
                checklist.getStatus(),
                checklist.getSortOrder(),
                checklist.getCreatedAt(),
                checklist.getUpdatedAt()
        );
    }

    private boolean isAiConfigured() {
        return aiEnabled && apiKey != null && !apiKey.isBlank();
    }

    private SettlementGuidanceDto requestAiGuidance(
            List<SettlementChecklist> checklists,
            UserProfile profile,
            SettlementGuidanceDto fallback
    ) {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("model", model);
        request.put("temperature", 0.2);
        request.put("max_output_tokens", 1400);
        request.put("input", buildGuidancePrompt(checklists, profile, fallback));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(responsesUrl))
                .timeout(Duration.ofSeconds(35))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(request.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI settlement request failed: " + response.statusCode());
            }
            String outputText = extractOutputText(objectMapper.readTree(response.body()));
            if (outputText.isBlank()) {
                return fallback;
            }
            return parseGuidance(objectMapper.readTree(cleanJson(outputText)), fallback);
        } catch (IOException exception) {
            throw new IllegalStateException("AI settlement response parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI settlement request interrupted", exception);
        }
    }

    private String buildGuidancePrompt(List<SettlementChecklist> checklists, UserProfile profile, SettlementGuidanceDto fallback) {
        String checklistText = checklists.stream()
                .map(item -> "- [%s] %s / %s / %s: %s".formatted(
                        safe(item.getStatus()),
                        safe(item.getCountry()),
                        safe(item.getCategory()),
                        safe(item.getChecklistTitle()),
                        safe(item.getDescription())))
                .collect(Collectors.joining("\n"));

        return """
                당신은 CareerLens의 해외취업 정착 준비 보조 분석기다.
                제공된 사용자 프로필과 DB 체크리스트 상태만 사용해서 정착 준비 요약을 만든다.
                최신 비자 법률, 공식 절차, 항공권 가격을 알고 있다고 말하지 마라.
                모든 법적/행정 판단은 공식기관과 전문가 확인이 필요하다는 고지를 포함한다.

                반드시 JSON 객체만 반환한다. 마크다운 코드블록을 쓰지 마라.
                스키마:
                {
                  "summary": "2~3문장 한국어 요약",
                  "priority_actions": ["가장 먼저 할 일", "다음 할 일", "확인할 일"],
                  "country_summaries": [
                    {
                      "country": "미국",
                      "risk_level": "LOW|MEDIUM|HIGH",
                      "next_actions": ["국가별 다음 액션 1", "국가별 다음 액션 2"]
                    }
                  ]
                }

                사용자 프로필:
                희망 국가: %s
                현재 국가: %s
                국적: %s
                희망 직무군: %s
                희망 직무명: %s
                입사 가능 시점: %s
                비자 스폰서십 필요 여부: %s
                영어 수준: %s
                일본어 수준: %s

                체크리스트 완료율: %d%%
                현재 기본 요약: %s

                체크리스트:
                %s
                """.formatted(
                profile == null ? "미기재" : safe(profile.getTargetCountry()),
                profile == null ? "미기재" : safe(profile.getCurrentCountry()),
                profile == null ? "미기재" : safe(profile.getNationality()),
                profile == null ? "미기재" : safe(profile.getTargetJobFamily()),
                profile == null ? "미기재" : safe(profile.getDesiredJobTitle()),
                profile == null ? "미기재" : safe(profile.getAvailableStartDate()),
                profile == null || profile.getVisaSponsorshipNeeded() == null ? "미기재" : profile.getVisaSponsorshipNeeded(),
                profile == null ? "미기재" : safe(profile.getEnglishLevel()),
                profile == null ? "미기재" : safe(profile.getJapaneseLevel()),
                fallback.completionRate(),
                fallback.summary(),
                checklistText
        );
    }

    private SettlementGuidanceDto parseGuidance(JsonNode root, SettlementGuidanceDto fallback) {
        String summary = text(root, "summary");
        List<String> priorityActions = strings(root.path("priority_actions"));
        List<SettlementCountrySummaryDto> countrySummaries = new ArrayList<>();
        JsonNode countries = root.path("country_summaries");
        if (countries.isArray()) {
            for (JsonNode node : countries) {
                String country = text(node, "country");
                if (country.isBlank()) {
                    continue;
                }
                Integer completionRate = fallback.countrySummaries().stream()
                        .filter(item -> country.equals(item.country()))
                        .findFirst()
                        .map(SettlementCountrySummaryDto::completionRate)
                        .orElse(0);
                countrySummaries.add(new SettlementCountrySummaryDto(
                        country,
                        completionRate,
                        riskLevel(text(node, "risk_level")),
                        strings(node.path("next_actions"))
                ));
            }
        }
        if (countrySummaries.isEmpty()) {
            countrySummaries = fallback.countrySummaries();
        }
        return new SettlementGuidanceDto(
                fallback.overallStatus(),
                fallback.completionRate(),
                summary.isBlank() ? fallback.summary() : summary,
                priorityActions.isEmpty() ? fallback.priorityActions() : priorityActions,
                countrySummaries,
                "AI_ASSISTED:" + provider.toUpperCase(Locale.ROOT),
                disclaimer()
        );
    }

    private SettlementGuidanceDto buildRuleBasedGuidance(List<SettlementChecklist> checklists, UserProfile profile, String generationMode) {
        int completionRate = completionRate(checklists);
        String targetCountry = profile == null ? "" : safe(profile.getTargetCountry());
        String visaNeed = profile != null && Boolean.TRUE.equals(profile.getVisaSponsorshipNeeded())
                ? "비자 스폰서십 확인을 우선순위에 두어야 합니다."
                : "비자 조건과 입사 가능 시점을 함께 확인해야 합니다.";
        String summary = "현재 정착 준비 완료율은 " + completionRate + "%입니다. "
                + (targetCountry.isBlank() || "미기재".equals(targetCountry) ? "미국/일본 기본 체크리스트를 기준으로" : targetCountry + " 목표 국가 기준으로")
                + " 비자, 출국 전 서류, 초기 정착 항목을 순서대로 확인하는 단계입니다. "
                + visaNeed;
        List<String> priorityActions = checklists.stream()
                .filter(item -> !STATUS_DONE.equals(item.getStatus()))
                .limit(4)
                .map(item -> item.getCountry() + " - " + item.getChecklistTitle())
                .collect(Collectors.toCollection(ArrayList::new));
        if (priorityActions.isEmpty()) {
            priorityActions.add("완료된 항목의 증빙 파일과 공식기관 확인 링크를 정리하세요.");
        }
        return new SettlementGuidanceDto(
                completionRate >= 70 ? "ON_TRACK" : completionRate >= 35 ? "NEEDS_ATTENTION" : "EARLY_STAGE",
                completionRate,
                summary,
                priorityActions,
                countrySummaries(checklists),
                generationMode,
                disclaimer()
        );
    }

    private List<SettlementCountrySummaryDto> countrySummaries(List<SettlementChecklist> checklists) {
        Map<String, List<SettlementChecklist>> byCountry = checklists.stream()
                .collect(Collectors.groupingBy(SettlementChecklist::getCountry));
        return byCountry.entrySet().stream()
                .map(entry -> {
                    int rate = completionRate(entry.getValue());
                    List<String> actions = entry.getValue().stream()
                            .filter(item -> !STATUS_DONE.equals(item.getStatus()))
                            .limit(3)
                            .map(SettlementChecklist::getChecklistTitle)
                            .collect(Collectors.toCollection(ArrayList::new));
                    if (actions.isEmpty()) {
                        actions.add("완료 항목의 증빙과 공식기관 확인 메모를 정리");
                    }
                    return new SettlementCountrySummaryDto(entry.getKey(), rate, rate >= 70 ? "LOW" : rate >= 35 ? "MEDIUM" : "HIGH", actions);
                })
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private int completionRate(List<SettlementChecklist> checklists) {
        if (checklists.isEmpty()) {
            return 0;
        }
        long done = checklists.stream().filter(item -> STATUS_DONE.equals(item.getStatus())).count();
        return Math.round((done * 100.0f) / checklists.size());
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
        String trimmed = value.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private List<String> strings(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode item : node) {
                String value = item.asText("").trim();
                if (!value.isBlank()) {
                    values.add(value);
                }
            }
        }
        return values;
    }

    private String text(JsonNode node, String name) {
        return node.path(name).asText("").trim();
    }

    private String riskLevel(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if ("LOW".equals(normalized) || "MEDIUM".equals(normalized) || "HIGH".equals(normalized)) {
            return normalized;
        }
        return "MEDIUM";
    }

    private String disclaimer() {
        return "이 안내는 CareerLens에 저장된 체크리스트와 사용자 입력을 바탕으로 만든 시연용 요약입니다. 비자, 세금, 체류자격, 행정 절차의 최신 판단은 반드시 공식기관과 전문가를 통해 확인해야 합니다.";
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "미기재" : value;
    }
}
