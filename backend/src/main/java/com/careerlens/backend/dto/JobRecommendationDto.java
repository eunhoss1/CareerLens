package com.careerlens.backend.dto;

import java.util.List;

public record JobRecommendationDto(
        Long diagnosisId,
        Long jobId,
        String companyName,
        String country,
        String jobTitle,
        String jobFamily,
        String salaryRange,
        String workType,
        String visaRequirement,
        String recommendationGrade,
        String readinessStatus,
        String readinessLabel,
        String recommendationSummary,
        String nextActionSummary,
        List<String> missingItems,
        ScoreBreakdownDto scoreBreakdown
) {
}
