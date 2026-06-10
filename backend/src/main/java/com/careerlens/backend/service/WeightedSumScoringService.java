package com.careerlens.backend.service;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class WeightedSumScoringService {

    private static final int MIN_SCORE = 0;
    private static final int MAX_SCORE = 100;

    public int calculate(List<WeightedCriterion> criteria) {
        if (criteria == null || criteria.isEmpty()) {
            return MIN_SCORE;
        }

        int totalWeight = criteria.stream()
                .mapToInt(WeightedCriterion::positiveWeight)
                .sum();

        if (totalWeight <= 0) {
            return MIN_SCORE;
        }

        double weightedScore = criteria.stream()
                .filter(criterion -> criterion.positiveWeight() > 0)
                .mapToDouble(criterion ->
                        criterion.normalizedValue() * (criterion.positiveWeight() / (double) totalWeight))
                .sum();

        return clamp((int) Math.round(weightedScore));
    }

    private int clamp(int value) {
        return Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));
    }

    public record WeightedCriterion(
            String criterionKey,
            int normalizedScore,
            int weight
    ) {
        private int normalizedValue() {
            return Math.max(MIN_SCORE, Math.min(MAX_SCORE, normalizedScore));
        }

        private int positiveWeight() {
            return Math.max(0, weight);
        }
    }
}
