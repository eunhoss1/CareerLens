package com.careerlens.backend.service;

import com.careerlens.backend.dto.DepartureMilestoneDto;
import com.careerlens.backend.dto.DeparturePlanDto;
import com.careerlens.backend.dto.DeparturePlanRequestDto;
import com.careerlens.backend.dto.FlightApiProviderDto;
import com.careerlens.backend.dto.FlightOfferDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DeparturePlanService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean aiEnabled;
    private final String provider;
    private final String apiKey;
    private final String model;
    private final String responsesUrl;
    private final String travelProvider;
    private final boolean duffelEnabled;
    private final String duffelAccessToken;
    private final String duffelBaseUrl;
    private final String duffelVersion;
    private final Integer duffelSupplierTimeoutMillis;
    private final boolean amadeusEnabled;
    private final String amadeusClientId;
    private final String amadeusClientSecret;
    private final String amadeusBaseUrl;
    private final String amadeusCurrencyCode;
    private volatile String amadeusAccessToken;
    private volatile Instant amadeusTokenExpiresAt;

    public DeparturePlanService(
            ObjectMapper objectMapper,
            @Value("${app.ai.openai.enabled:false}") boolean aiEnabled,
            @Value("${app.ai.provider:openai}") String provider,
            @Value("${app.ai.openai.api-key:}") String openAiApiKey,
            @Value("${app.ai.openai.model:gpt-5.4}") String openAiModel,
            @Value("${app.ai.openai.responses-url:https://api.openai.com/v1/responses}") String openAiResponsesUrl,
            @Value("${app.ai.groq.api-key:}") String groqApiKey,
            @Value("${app.ai.groq.model:openai/gpt-oss-20b}") String groqModel,
            @Value("${app.ai.groq.responses-url:https://api.groq.com/openai/v1/responses}") String groqResponsesUrl,
            @Value("${app.travel.provider:duffel}") String travelProvider,
            @Value("${app.travel.duffel.enabled:false}") boolean duffelEnabled,
            @Value("${app.travel.duffel.access-token:}") String duffelAccessToken,
            @Value("${app.travel.duffel.base-url:https://api.duffel.com}") String duffelBaseUrl,
            @Value("${app.travel.duffel.version:v2}") String duffelVersion,
            @Value("${app.travel.duffel.supplier-timeout-millis:10000}") Integer duffelSupplierTimeoutMillis,
            @Value("${app.travel.amadeus.enabled:false}") boolean amadeusEnabled,
            @Value("${app.travel.amadeus.client-id:}") String amadeusClientId,
            @Value("${app.travel.amadeus.client-secret:}") String amadeusClientSecret,
            @Value("${app.travel.amadeus.base-url:https://test.api.amadeus.com}") String amadeusBaseUrl,
            @Value("${app.travel.amadeus.currency-code:KRW}") String amadeusCurrencyCode
    ) {
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
        this.travelProvider = travelProvider == null ? "duffel" : travelProvider.trim().toLowerCase(Locale.ROOT);
        this.duffelEnabled = duffelEnabled;
        this.duffelAccessToken = duffelAccessToken;
        this.duffelBaseUrl = trimTrailingSlash(duffelBaseUrl, "https://api.duffel.com");
        this.duffelVersion = duffelVersion == null || duffelVersion.isBlank() ? "v2" : duffelVersion.trim();
        this.duffelSupplierTimeoutMillis = duffelSupplierTimeoutMillis == null ? 10000 : Math.max(2000, Math.min(60000, duffelSupplierTimeoutMillis));
        this.amadeusEnabled = amadeusEnabled;
        this.amadeusClientId = amadeusClientId;
        this.amadeusClientSecret = amadeusClientSecret;
        this.amadeusBaseUrl = trimTrailingSlash(amadeusBaseUrl, "https://test.api.amadeus.com");
        this.amadeusCurrencyCode = amadeusCurrencyCode == null || amadeusCurrencyCode.isBlank() ? "KRW" : amadeusCurrencyCode.trim().toUpperCase(Locale.ROOT);
    }

    public DeparturePlanDto generatePlan(DeparturePlanRequestDto request) {
        DeparturePlanDto fallback = buildRuleBasedPlan(request, "RULE_BASED");
        if (!isAiConfigured()) {
            return fallback;
        }

        try {
            DeparturePlanDto aiPlan = requestAiPlan(request, fallback);
            if (aiPlan.summary() == null || aiPlan.summary().isBlank() || aiPlan.milestones().size() < 4) {
                return fallback;
            }
            return aiPlan;
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    private DeparturePlanDto requestAiPlan(DeparturePlanRequestDto request, DeparturePlanDto fallback) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", model);
        payload.put("temperature", 0.2);
        payload.put("max_output_tokens", 1800);
        payload.put("input", buildPrompt(request, fallback));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(responsesUrl))
                .timeout(Duration.ofSeconds(35))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI departure plan request failed: " + response.statusCode());
            }
            String outputText = extractOutputText(objectMapper.readTree(response.body()));
            if (outputText.isBlank()) {
                return fallback;
            }
            return parsePlan(objectMapper.readTree(cleanJson(outputText)), fallback);
        } catch (IOException exception) {
            throw new IllegalStateException("AI departure plan response parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI departure plan request interrupted", exception);
        }
    }

    private String buildPrompt(DeparturePlanRequestDto request, DeparturePlanDto fallback) {
        return """
                당신은 CareerLens의 해외취업 출국 로드맵 보조 분석기다.
                입력된 입사 예정일, 출발/도착 공항, 비자/숙소 상태만 사용해서 출국 준비 일정을 만든다.
                실시간 항공편, 항공권 가격, 좌석 재고를 알고 있다고 말하지 마라.
                항공편은 공식 API나 항공사/OTA에서 최종 확인해야 한다는 고지를 유지한다.

                반드시 JSON 객체만 반환한다. 마크다운 코드블록을 쓰지 마라.
                스키마:
                {
                  "summary": "2~3문장 한국어 요약",
                  "flight_search_note": "항공편 조회 시 확인할 조건 요약",
                  "milestones": [
                    {
                      "phase": "T-6W",
                      "title": "구체적 준비 항목",
                      "description": "수행 방법과 확인 기준",
                      "due_date": "YYYY-MM-DD",
                      "status": "TODO|URGENT|DONE"
                    }
                  ]
                }

                요청 정보:
                국가: %s
                도시: %s
                출발 공항: %s
                도착 공항: %s
                입사 예정일: %s
                권장 입국일: %s
                출국 후보 기간: %s ~ %s
                비자 상태: %s
                숙소 상태: %s
                기본 요약: %s
                """.formatted(
                safe(request.targetCountry()),
                safe(request.destinationCity()),
                safe(request.originAirport()),
                safe(request.destinationAirport()),
                request.startDate(),
                fallback.recommendedArrivalDate(),
                fallback.departureWindowStart(),
                fallback.departureWindowEnd(),
                safe(request.visaStatus()),
                safe(request.housingStatus()),
                fallback.summary()
        );
    }

    private DeparturePlanDto parsePlan(JsonNode root, DeparturePlanDto fallback) {
        String summary = text(root, "summary");
        String flightSearchNote = text(root, "flight_search_note");
        List<DepartureMilestoneDto> milestones = new ArrayList<>();
        JsonNode nodes = root.path("milestones");
        if (nodes.isArray()) {
            for (JsonNode node : nodes) {
                LocalDate dueDate = parseDate(text(node, "due_date"), fallback.recommendedArrivalDate());
                String title = text(node, "title");
                if (title.isBlank()) {
                    continue;
                }
                milestones.add(new DepartureMilestoneDto(
                        defaultText(text(node, "phase"), "준비"),
                        title,
                        defaultText(text(node, "description"), "출국 전 확인이 필요한 항목입니다."),
                        dueDate,
                        normalizeStatus(text(node, "status"))
                ));
            }
        }
        if (milestones.isEmpty()) {
            milestones = fallback.milestones();
        }
        return new DeparturePlanDto(
                fallback.targetCountry(),
                fallback.destinationCity(),
                fallback.originAirport(),
                fallback.destinationAirport(),
                fallback.startDate(),
                fallback.recommendedArrivalDate(),
                fallback.departureWindowStart(),
                fallback.departureWindowEnd(),
                fallback.daysUntilDepartureWindow(),
                fallback.urgencyStatus(),
                summary.isBlank() ? fallback.summary() : summary,
                flightSearchNote.isBlank() ? fallback.flightSearchNote() : flightSearchNote,
                fallback.flightDataStatus(),
                fallback.flightOffers(),
                milestones,
                fallback.flightApiProviders(),
                "AI_ASSISTED:" + provider.toUpperCase(Locale.ROOT),
                disclaimer()
        );
    }

    private DeparturePlanDto buildRuleBasedPlan(DeparturePlanRequestDto request, String generationMode) {
        int bufferDays = request.arrivalBufferDays() == null ? 14 : Math.max(3, Math.min(45, request.arrivalBufferDays()));
        LocalDate recommendedArrivalDate = request.startDate().minusDays(bufferDays);
        LocalDate windowStart = recommendedArrivalDate.minusDays(5);
        LocalDate windowEnd = recommendedArrivalDate;
        long daysUntilWindow = ChronoUnit.DAYS.between(LocalDate.now(), windowStart);
        String urgency = urgencyStatus(daysUntilWindow);
        String summary = "%s %s 입사 예정일 기준으로 %s까지 입국하고, %s부터 %s 사이 항공편을 우선 탐색하는 계획입니다. 비자 상태는 %s, 숙소 상태는 %s로 입력되어 있어 출국 전 확인 항목을 함께 관리해야 합니다."
                .formatted(
                        safe(request.targetCountry()),
                        safe(request.destinationCity()),
                        recommendedArrivalDate,
                        windowStart,
                        windowEnd,
                        safe(request.visaStatus()),
                        safe(request.housingStatus())
                );
        List<DepartureMilestoneDto> milestones = new ArrayList<>();
        milestones.add(milestone("T-8W", "비자/오퍼 서류 확인", "오퍼레터, 비자 스폰서십, 입사 예정일, 제출 서류를 한 번에 정리합니다.", request.startDate().minusWeeks(8), urgencyForDueDate(request.startDate().minusWeeks(8))));
        milestones.add(milestone("T-6W", "항공편 후보 구간 탐색", request.originAirport() + " -> " + request.destinationAirport() + " 구간의 직항/경유, 수하물, 환승 시간을 비교합니다.", windowStart.minusWeeks(2), urgencyForDueDate(windowStart.minusWeeks(2))));
        milestones.add(milestone("T-4W", "임시 숙소와 도착 동선 정리", "도착 공항에서 임시 숙소까지 이동 방법, 체크인 시간, 첫 출근 전 이동 동선을 정리합니다.", recommendedArrivalDate.minusWeeks(4), urgencyForDueDate(recommendedArrivalDate.minusWeeks(4))));
        milestones.add(milestone("T-2W", "출국 서류 패키지 확정", "여권, 비자/재류자격, 보험, 회사 제출 서류, 학력/경력 증빙을 오프라인/클라우드에 이중 보관합니다.", recommendedArrivalDate.minusWeeks(2), urgencyForDueDate(recommendedArrivalDate.minusWeeks(2))));
        milestones.add(milestone("T-0", "입국 후 72시간 체크", "주소 등록, 통신, 은행, 회사 첫 출근 준비, 긴급 연락처를 확인합니다.", recommendedArrivalDate.plusDays(3), "TODO"));
        List<FlightOfferDto> flightOffers = flightOffersFor(request, recommendedArrivalDate);
        String flightSearchNote = flightOffers.isEmpty()
                ? "현재 연결 가능한 실시간 항공편 후보가 없습니다. Duffel/Amadeus API 키가 없거나, 테스트 환경 데이터셋에 해당 노선/날짜 결과가 없을 수 있습니다. 실제 항공편은 공식 항공사, OTA 또는 승인된 Flight API에서 최종 확인해야 합니다."
                : flightOffers.get(0).provider() + " 공식 API에서 권장 입국일 기준 항공편 후보를 조회했습니다. 테스트 환경은 실제 스케줄/가격과 다를 수 있으므로 최종 예약 전 공식 채널에서 재확인해야 합니다.";

        return new DeparturePlanDto(
                request.targetCountry(),
                request.destinationCity(),
                request.originAirport(),
                request.destinationAirport(),
                request.startDate(),
                recommendedArrivalDate,
                windowStart,
                windowEnd,
                daysUntilWindow,
                urgency,
                summary,
                flightSearchNote,
                flightDataStatus(flightOffers),
                flightOffers,
                milestones,
                flightApiProviders(),
                generationMode,
                disclaimer()
        );
    }

    private DepartureMilestoneDto milestone(String phase, String title, String description, LocalDate dueDate, String status) {
        return new DepartureMilestoneDto(phase, title, description, dueDate, status);
    }

    private List<FlightApiProviderDto> flightApiProviders() {
        List<FlightApiProviderDto> providers = new ArrayList<>();
        providers.add(new FlightApiProviderDto(
                "Duffel Flights API",
                "Offer Request 생성으로 항공편 후보, 구간, 항공사, 가격 정보를 조회",
                duffelConfigured() ? "Primary provider configured" : "Recommended provider",
                "테스트 토큰은 duffel_test_로 시작하며, CareerLens에서는 예약/결제 없이 항공편 후보 표시까지만 사용합니다."
        ));
        providers.add(new FlightApiProviderDto(
                "Amadeus Flight Offers Search",
                "출발/도착 공항, 날짜, 승객 수 기준 항공권 후보와 가격 조회",
                amadeusConfigured() ? "Legacy/self-service key configured" : "Legacy optional",
                "Self-Service 신규 등록이 제한되고 2026-07-17 decommission 예정이므로, 기존 키 보유 시에만 선택적으로 사용합니다."
        ));
        providers.add(new FlightApiProviderDto(
                "Skyscanner Flights API",
                "실시간/캐시 기반 항공권 검색, OTA/항공사 공급망 연동",
                "Partner approval required",
                "제휴 신청 및 승인 후 사용할 수 있는 파트너 API 성격이 강합니다."
        ));
        providers.add(new FlightApiProviderDto(
                "Manual itinerary input",
                "사용자가 직접 확인한 항공편 시간, 가격, 예약 링크를 저장",
                "Recommended prototype path",
                "캡스톤 시연 단계에서는 법적 리스크, API 승인, 키 발급 의존도를 줄이는 가장 안정적인 방식입니다."
        ));
        return providers;
    }

    private List<FlightOfferDto> flightOffersFor(DeparturePlanRequestDto request, LocalDate departureDate) {
        List<FlightOfferDto> duffelOffers = new ArrayList<>();
        if (!"amadeus".equals(travelProvider) && duffelConfigured()) {
            try {
                duffelOffers = requestDuffelFlightOffers(request, departureDate);
            } catch (RuntimeException exception) {
                duffelOffers = new ArrayList<>();
            }
            if (!duffelOffers.isEmpty()) {
                return duffelOffers;
            }
        }

        if (amadeusConfigured()) {
            try {
                return requestAmadeusFlightOffers(request, departureDate);
            } catch (RuntimeException exception) {
                return new ArrayList<>();
            }
        }
        return new ArrayList<>();
    }

    private List<FlightOfferDto> requestDuffelFlightOffers(DeparturePlanRequestDto request, LocalDate departureDate) {
        ObjectNode root = objectMapper.createObjectNode();
        ObjectNode data = root.putObject("data");
        data.put("cabin_class", "economy");
        data.put("max_connections", 1);
        data.putArray("passengers").addObject().put("type", "adult");
        ObjectNode slice = data.putArray("slices").addObject();
        slice.put("origin", safeAirportCode(request.originAirport()));
        slice.put("destination", safeAirportCode(request.destinationAirport()));
        slice.put("departure_date", departureDate.toString());

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(duffelBaseUrl + "/air/offer_requests?return_offers=true&supplier_timeout=" + duffelSupplierTimeoutMillis))
                .timeout(Duration.ofSeconds(35))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .header("Duffel-Version", duffelVersion)
                .header("Authorization", "Bearer " + duffelAccessToken)
                .POST(HttpRequest.BodyPublishers.ofString(root.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Duffel offer request failed: " + response.statusCode());
            }
            return parseDuffelOffers(objectMapper.readTree(response.body()));
        } catch (IOException exception) {
            throw new IllegalStateException("Duffel offer response parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Duffel offer request interrupted", exception);
        }
    }

    private List<FlightOfferDto> requestAmadeusFlightOffers(DeparturePlanRequestDto request, LocalDate departureDate) {
        String token = amadeusToken();
        String query = "originLocationCode=" + encode(request.originAirport())
                + "&destinationLocationCode=" + encode(request.destinationAirport())
                + "&departureDate=" + encode(departureDate.toString())
                + "&adults=1"
                + "&currencyCode=" + encode(amadeusCurrencyCode)
                + "&max=5";
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(amadeusBaseUrl + "/v2/shopping/flight-offers?" + query))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Amadeus flight offers request failed: " + response.statusCode());
            }
            return parseAmadeusOffers(objectMapper.readTree(response.body()));
        } catch (IOException exception) {
            throw new IllegalStateException("Amadeus flight offers parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Amadeus flight offers request interrupted", exception);
        }
    }

    private String amadeusToken() {
        if (amadeusAccessToken != null && amadeusTokenExpiresAt != null && Instant.now().isBefore(amadeusTokenExpiresAt.minusSeconds(30))) {
            return amadeusAccessToken;
        }

        String body = "grant_type=client_credentials"
                + "&client_id=" + encode(amadeusClientId)
                + "&client_secret=" + encode(amadeusClientSecret);
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(amadeusBaseUrl + "/v1/security/oauth2/token"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Amadeus token request failed: " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String token = root.path("access_token").asText("");
            int expiresIn = root.path("expires_in").asInt(0);
            if (token.isBlank()) {
                throw new IllegalStateException("Amadeus token response did not include access_token");
            }
            amadeusAccessToken = token;
            amadeusTokenExpiresAt = Instant.now().plusSeconds(Math.max(60, expiresIn));
            return token;
        } catch (IOException exception) {
            throw new IllegalStateException("Amadeus token parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Amadeus token request interrupted", exception);
        }
    }

    private List<FlightOfferDto> parseDuffelOffers(JsonNode root) {
        List<FlightOfferDto> offers = new ArrayList<>();
        JsonNode offerNodes = root.path("data").path("offers");
        if (!offerNodes.isArray()) {
            return offers;
        }

        for (JsonNode offer : offerNodes) {
            JsonNode slice = firstNode(offer.path("slices"));
            JsonNode segments = slice.path("segments");
            JsonNode firstSegment = firstNode(segments);
            JsonNode lastSegment = lastNode(segments);
            JsonNode origin = firstSegment.path("origin");
            JsonNode destination = lastSegment.path("destination");
            JsonNode carrier = firstSegment.path("operating_carrier").isMissingNode() || firstSegment.path("operating_carrier").isNull()
                    ? firstSegment.path("marketing_carrier")
                    : firstSegment.path("operating_carrier");
            String flightNumber = firstNonBlank(
                    firstSegment.path("operating_carrier_flight_number").asText(""),
                    firstSegment.path("marketing_carrier_flight_number").asText("")
            );
            offers.add(new FlightOfferDto(
                    "Duffel",
                    origin.path("iata_code").asText(""),
                    destination.path("iata_code").asText(""),
                    firstSegment.path("departing_at").asText(""),
                    lastSegment.path("arriving_at").asText(""),
                    carrier.path("name").asText(""),
                    carrier.path("iata_code").asText(""),
                    flightNumber,
                    firstNonBlank(slice.path("duration").asText(""), firstSegment.path("duration").asText("")),
                    offer.path("total_currency").asText(""),
                    offer.path("total_amount").asText(""),
                    null
            ));
        }
        return offers;
    }

    private JsonNode firstNode(JsonNode node) {
        return node.isArray() && !node.isEmpty() ? node.get(0) : objectMapper.createObjectNode();
    }

    private JsonNode lastNode(JsonNode node) {
        return node.isArray() && !node.isEmpty() ? node.get(node.size() - 1) : objectMapper.createObjectNode();
    }

    private List<FlightOfferDto> parseAmadeusOffers(JsonNode root) {
        List<FlightOfferDto> offers = new ArrayList<>();
        JsonNode data = root.path("data");
        if (!data.isArray()) {
            return offers;
        }

        for (JsonNode offer : data) {
            JsonNode itinerary = offer.path("itineraries").isArray() && !offer.path("itineraries").isEmpty()
                    ? offer.path("itineraries").get(0)
                    : objectMapper.createObjectNode();
            JsonNode segments = itinerary.path("segments");
            JsonNode firstSegment = segments.isArray() && !segments.isEmpty() ? segments.get(0) : objectMapper.createObjectNode();
            JsonNode lastSegment = segments.isArray() && !segments.isEmpty() ? segments.get(segments.size() - 1) : firstSegment;
            JsonNode price = offer.path("price");
            offers.add(new FlightOfferDto(
                    "Amadeus",
                    firstSegment.path("departure").path("iataCode").asText(""),
                    lastSegment.path("arrival").path("iataCode").asText(""),
                    firstSegment.path("departure").path("at").asText(""),
                    lastSegment.path("arrival").path("at").asText(""),
                    firstSegment.path("carrierCode").asText(""),
                    firstSegment.path("carrierCode").asText(""),
                    firstSegment.path("number").asText(""),
                    itinerary.path("duration").asText(""),
                    price.path("currency").asText(""),
                    price.path("total").asText(""),
                    offer.path("numberOfBookableSeats").isNumber() ? offer.path("numberOfBookableSeats").asInt() : null
            ));
        }
        return offers;
    }

    private String flightDataStatus(List<FlightOfferDto> offers) {
        if (!duffelConfigured() && !amadeusConfigured()) {
            return "NOT_CONFIGURED";
        }
        if (offers.isEmpty()) {
            return "NO_RESULTS_OR_FAILED";
        }
        return "Duffel".equals(offers.get(0).provider()) ? "LIVE_DUFFEL" : "LIVE_AMADEUS";
    }

    private boolean duffelConfigured() {
        return duffelEnabled && duffelAccessToken != null && !duffelAccessToken.isBlank();
    }

    private boolean amadeusConfigured() {
        return amadeusEnabled
                && amadeusClientId != null && !amadeusClientId.isBlank()
                && amadeusClientSecret != null && !amadeusClientSecret.isBlank();
    }

    private boolean isAiConfigured() {
        return aiEnabled && apiKey != null && !apiKey.isBlank();
    }

    private String urgencyStatus(long daysUntilWindow) {
        if (daysUntilWindow < 0) {
            return "OVERDUE";
        }
        if (daysUntilWindow <= 7) {
            return "URGENT";
        }
        if (daysUntilWindow <= 30) {
            return "SOON";
        }
        return "ON_TRACK";
    }

    private String urgencyForDueDate(LocalDate dueDate) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
        if (days < 0) {
            return "DONE";
        }
        if (days <= 7) {
            return "URGENT";
        }
        return "TODO";
    }

    private String normalizeStatus(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if ("TODO".equals(normalized) || "URGENT".equals(normalized) || "DONE".equals(normalized)) {
            return normalized;
        }
        return "TODO";
    }

    private LocalDate parseDate(String value, LocalDate fallback) {
        try {
            return value == null || value.isBlank() ? fallback : LocalDate.parse(value);
        } catch (RuntimeException exception) {
            return fallback;
        }
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

    private String text(JsonNode node, String name) {
        return node.path(name).asText("").trim();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String disclaimer() {
        return "이 출국 로드맵은 시연용 일정 보조 결과입니다. 실시간 항공편, 가격, 좌석, 비자/입국 요건은 공식 항공사, 승인된 Flight API, 정부/공식기관 자료에서 최종 확인해야 합니다.";
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "미기재" : value;
    }

    private String safeAirportCode(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : (second == null ? "" : second);
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value.trim(), StandardCharsets.UTF_8);
    }

    private String trimTrailingSlash(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }
}
