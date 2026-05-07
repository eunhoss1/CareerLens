package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.List;

public record DeparturePlanDto(
        @JsonProperty("target_country")
        String targetCountry,
        @JsonProperty("destination_city")
        String destinationCity,
        @JsonProperty("origin_airport")
        String originAirport,
        @JsonProperty("destination_airport")
        String destinationAirport,
        @JsonProperty("start_date")
        LocalDate startDate,
        @JsonProperty("recommended_arrival_date")
        LocalDate recommendedArrivalDate,
        @JsonProperty("departure_window_start")
        LocalDate departureWindowStart,
        @JsonProperty("departure_window_end")
        LocalDate departureWindowEnd,
        @JsonProperty("days_until_departure_window")
        Long daysUntilDepartureWindow,
        @JsonProperty("urgency_status")
        String urgencyStatus,
        String summary,
        @JsonProperty("flight_search_note")
        String flightSearchNote,
        @JsonProperty("flight_data_status")
        String flightDataStatus,
        @JsonProperty("flight_offers")
        List<FlightOfferDto> flightOffers,
        List<DepartureMilestoneDto> milestones,
        @JsonProperty("flight_api_providers")
        List<FlightApiProviderDto> flightApiProviders,
        @JsonProperty("generation_mode")
        String generationMode,
        String disclaimer
) {
}
