package com.careerlens.backend.controller;

import com.careerlens.backend.dto.RecommendationDiagnoseRequestDto;
import com.careerlens.backend.dto.RecommendationDiagnosisResponseDto;
import com.careerlens.backend.service.RecommendationServiceV2;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationServiceV2 recommendationServiceV2;

    public RecommendationController(RecommendationServiceV2 recommendationServiceV2) {
        this.recommendationServiceV2 = recommendationServiceV2;
    }

    @PostMapping("/diagnose")
    public RecommendationDiagnosisResponseDto diagnose(@Valid @RequestBody RecommendationDiagnoseRequestDto request) {
        return recommendationServiceV2.diagnose(request);
    }

    @PostMapping("/diagnose/users/{userId}")
    public RecommendationDiagnosisResponseDto diagnoseStoredProfile(@PathVariable Long userId) {
        return recommendationServiceV2.diagnoseStoredProfile(userId);
    }

    @GetMapping("/{userId}")
    public RecommendationDiagnosisResponseDto getRecommendations(@PathVariable Long userId) {
        return recommendationServiceV2.getLatestRecommendations(userId);
    }
}
