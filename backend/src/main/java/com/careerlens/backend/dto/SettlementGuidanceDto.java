package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record SettlementGuidanceDto(
        @JsonProperty("overall_status")
        String overallStatus,
        @JsonProperty("completion_rate")
        Integer completionRate,
        String summary,
        @JsonProperty("priority_actions")
        List<String> priorityActions,
        @JsonProperty("country_summaries")
        List<SettlementCountrySummaryDto> countrySummaries,
        @JsonProperty("generation_mode")
        String generationMode,
        String disclaimer
) {
}
