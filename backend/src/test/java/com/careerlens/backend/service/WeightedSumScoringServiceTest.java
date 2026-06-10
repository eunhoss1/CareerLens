package com.careerlens.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class WeightedSumScoringServiceTest {

    private final WeightedSumScoringService service = new WeightedSumScoringService();

    @Test
    void calculatesWeightedSumWithNormalizedCriteria() {
        List<WeightedSumScoringService.WeightedCriterion> criteria = new ArrayList<>();
        criteria.add(new WeightedSumScoringService.WeightedCriterion("acceptance_probability", 80, 30));
        criteria.add(new WeightedSumScoringService.WeightedCriterion("salary", 60, 15));
        criteria.add(new WeightedSumScoringService.WeightedCriterion("work_life_balance", 70, 15));
        criteria.add(new WeightedSumScoringService.WeightedCriterion("company_value", 90, 15));
        criteria.add(new WeightedSumScoringService.WeightedCriterion("job_fit", 75, 25));

        int score = service.calculate(criteria);

        assertThat(score).isEqualTo(76);
    }

    @Test
    void normalizesWeightsWhenTheyDoNotSumToOneHundred() {
        List<WeightedSumScoringService.WeightedCriterion> criteria = new ArrayList<>();
        criteria.add(new WeightedSumScoringService.WeightedCriterion("first", 100, 1));
        criteria.add(new WeightedSumScoringService.WeightedCriterion("second", 0, 1));

        int score = service.calculate(criteria);

        assertThat(score).isEqualTo(50);
    }

    @Test
    void clampsCriterionScoresToComparableZeroToOneHundredScale() {
        List<WeightedSumScoringService.WeightedCriterion> criteria = new ArrayList<>();
        criteria.add(new WeightedSumScoringService.WeightedCriterion("too_high", 130, 1));
        criteria.add(new WeightedSumScoringService.WeightedCriterion("too_low", -20, 1));

        int score = service.calculate(criteria);

        assertThat(score).isEqualTo(50);
    }
}
