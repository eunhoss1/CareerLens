package com.careerlens.backend.service;

import com.careerlens.backend.entity.DiagnosisResult.ReadinessStatus;
import com.careerlens.backend.entity.JobPosting;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AiExplanationService {

    public String buildRecommendationSummary(JobPosting job, int totalScore, List<String> matchedSkills, List<String> missingItems) {
        String skillText = matchedSkills.isEmpty()
                ? "핵심 기술 일치도는 아직 낮지만"
                : String.join(", ", matchedSkills.subList(0, Math.min(3, matchedSkills.size()))) + " 역량이 공고 패턴과 맞고";
        String gapText = missingItems.isEmpty()
                ? "큰 결격 요소가 적습니다"
                : "보완할 항목은 " + String.join(", ", missingItems.subList(0, Math.min(2, missingItems.size()))) + "입니다";
        return "%s의 %s 포지션은 %s 총 적합도 %d점으로 추천됩니다. %s."
                .formatted(job.getCompanyName(), job.getJobTitle(), skillText, totalScore, gapText);
    }

    public String buildNextActionSummary(ReadinessStatus readinessStatus, List<String> missingItems) {
        if (readinessStatus == ReadinessStatus.IMMEDIATE_APPLY) {
            return "지원서와 포트폴리오를 공고 키워드 중심으로 정리한 뒤 바로 지원 단계로 넘어갈 수 있습니다.";
        }
        if (readinessStatus == ReadinessStatus.PREPARE_THEN_APPLY) {
            String focus = missingItems.isEmpty() ? "대표 프로젝트 설명" : missingItems.get(0);
            return "커리어 개발 플래너에서 2~4주 준비 과제로 " + focus + "을 먼저 보완한 뒤 지원하는 흐름이 적합합니다.";
        }
        String focus = missingItems.isEmpty() ? "핵심 역량" : missingItems.get(0);
        return "현재는 장기 준비가 필요합니다. " + focus + "부터 로드맵에 넣고 기초 역량과 검증 자료를 쌓는 것이 우선입니다.";
    }
}
