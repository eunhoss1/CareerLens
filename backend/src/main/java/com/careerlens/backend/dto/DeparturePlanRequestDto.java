package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record DeparturePlanRequestDto(
        @NotBlank
        @JsonProperty("target_country")
        String targetCountry,
        @NotBlank
        @JsonProperty("destination_city")
        String destinationCity,
        @NotBlank
        @JsonProperty("origin_airport")
        String originAirport,
        @NotBlank
        @JsonProperty("destination_airport")
        String destinationAirport,
        @NotNull
        @JsonProperty("start_date")
        LocalDate startDate,
        @JsonProperty("arrival_buffer_days")
        Integer arrivalBufferDays,
        @JsonProperty("visa_status")
        String visaStatus,
        @JsonProperty("housing_status")
        String housingStatus
) {
}
