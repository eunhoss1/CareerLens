package com.careerlens.backend.service;

import com.careerlens.backend.dto.PlannerRoadmapDto;
import com.careerlens.backend.dto.PlannerTaskDto;
import com.careerlens.backend.entity.DiagnosisResult;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PlannerRoadmap;
import com.careerlens.backend.entity.PlannerTask;
import com.careerlens.backend.repository.DiagnosisResultRepository;
import com.careerlens.backend.repository.PlannerRoadmapRepository;
import com.careerlens.backend.repository.PlannerTaskRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlannerService {

    private static final String STATUS_TODO = "TODO";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_DONE = "DONE";
    private static final String MODE_AI_ASSISTED = "AI_ASSISTED";
    private static final String MODE_RULE_BASED = "RULE_BASED";

    private final DiagnosisResultRepository diagnosisResultRepository;
    private final PlannerRoadmapRepository plannerRoadmapRepository;
    private final PlannerTaskRepository plannerTaskRepository;
    private final PlannerTaskDraftService plannerTaskDraftService;

    public PlannerService(
            DiagnosisResultRepository diagnosisResultRepository,
            PlannerRoadmapRepository plannerRoadmapRepository,
            PlannerTaskRepository plannerTaskRepository,
            PlannerTaskDraftService plannerTaskDraftService
    ) {
        this.diagnosisResultRepository = diagnosisResultRepository;
        this.plannerRoadmapRepository = plannerRoadmapRepository;
        this.plannerTaskRepository = plannerTaskRepository;
        this.plannerTaskDraftService = plannerTaskDraftService;
    }

    @Transactional
    public PlannerRoadmapDto createFromDiagnosis(Long diagnosisId) {
        PlannerRoadmap existing = plannerRoadmapRepository.findByDiagnosisResultId(diagnosisId).orElse(null);
        if (existing != null) {
            return toDto(existing);
        }

        DiagnosisResult diagnosis = diagnosisResultRepository.findWithDetailsById(diagnosisId)
                .orElseThrow(() -> new IllegalArgumentException("Diagnosis result not found: " + diagnosisId));
        JobPosting job = diagnosis.getJobPosting();
        int durationWeeks = durationWeeks(diagnosis);
        boolean aiConfigured = plannerTaskDraftService.isAiConfigured();

        PlannerRoadmap roadmap = new PlannerRoadmap();
        roadmap.setUser(diagnosis.getUser());
        roadmap.setDiagnosisResult(diagnosis);
        roadmap.setTargetCompany(job.getCompanyName());
        roadmap.setTargetJobTitle(job.getJobTitle());
        roadmap.setReadinessStatus(diagnosis.getReadinessStatus().name());
        roadmap.setTotalScore(diagnosis.getTotalScore());
        roadmap.setDurationWeeks(durationWeeks);
        roadmap.setGenerationMode(aiConfigured ? MODE_AI_ASSISTED + ":" + plannerTaskDraftService.providerName().toUpperCase() : MODE_RULE_BASED);
        roadmap.setTitle(job.getCompanyName() + " " + job.getJobTitle() + " 준비 로드맵");
        roadmap.setSummary(buildSummary(diagnosis, job, durationWeeks, aiConfigured));
        roadmap.setCreatedAt(LocalDateTime.now());
        PlannerRoadmap savedRoadmap = plannerRoadmapRepository.save(roadmap);

        List<PlannerTask> tasks = plannerTaskDraftService.generateTasks(diagnosis, job, durationWeeks).stream()
                .map(draft -> toTask(savedRoadmap, draft))
                .toList();
        for (int index = 0; index < tasks.size(); index++) {
            tasks.get(index).setSortOrder(index + 1);
        }
        plannerTaskRepository.saveAll(tasks);
        return toDto(savedRoadmap);
    }

    @Transactional(readOnly = true)
    public PlannerRoadmapDto getRoadmap(Long roadmapId) {
        PlannerRoadmap roadmap = plannerRoadmapRepository.findWithDetailsById(roadmapId)
                .orElseThrow(() -> new IllegalArgumentException("Planner roadmap not found: " + roadmapId));
        return toDto(roadmap);
    }

    @Transactional(readOnly = true)
    public List<PlannerRoadmapDto> getUserRoadmaps(Long userId) {
        return plannerRoadmapRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PlannerRoadmapDto updateTaskStatus(Long taskId, String status) {
        PlannerTask task = plannerTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Planner task not found: " + taskId));
        task.setStatus(normalizeStatus(status));
        plannerTaskRepository.save(task);
        return toDto(task.getRoadmap());
    }

    private String buildSummary(DiagnosisResult diagnosis, JobPosting job, int durationWeeks, boolean aiConfigured) {
        String mode = aiConfigured ? "AI 보조 생성" : "규칙 기반 생성";
        if (diagnosis.getMissingItems().isEmpty()) {
            return mode + " 로드맵입니다. " + job.getCompanyName() + " 공고는 현재 프로필과 적합도가 높으므로 "
                    + durationWeeks + "주 동안 지원서, 포트폴리오, 지원 체크리스트를 정리합니다.";
        }
        return mode + " 로드맵입니다. " + job.getCompanyName() + " 공고의 부족 요소 "
                + diagnosis.getMissingItems().size() + "개를 " + durationWeeks
                + "주 동안 기술 보완, 프로젝트 증빙, 지원서 정리 과제로 나누어 준비합니다.";
    }

    private int durationWeeks(DiagnosisResult diagnosis) {
        return switch (diagnosis.getReadinessStatus()) {
            case IMMEDIATE_APPLY -> 4;
            case PREPARE_THEN_APPLY -> 8;
            case LONG_TERM_PREPARE -> 12;
        };
    }

    private PlannerTask toTask(PlannerRoadmap roadmap, PlannerTaskDraft draft) {
        PlannerTask task = new PlannerTask();
        task.setRoadmap(roadmap);
        task.setWeekNumber(draft.weekNumber());
        task.setCategory(draft.category());
        task.setTitle(draft.title());
        task.setDescription(draft.description());
        task.setExpectedOutputs(draft.expectedOutputs());
        task.setVerificationCriteria(draft.verificationCriteria());
        task.setEstimatedHours(draft.estimatedHours());
        task.setDifficulty(draft.difficulty());
        task.setStatus(STATUS_TODO);
        return task;
    }

    private PlannerRoadmapDto toDto(PlannerRoadmap roadmap) {
        List<PlannerTaskDto> tasks = plannerTaskRepository.findByRoadmapIdOrderBySortOrderAsc(roadmap.getId()).stream()
                .map(this::toTaskDto)
                .toList();
        int totalTaskCount = tasks.size();
        int completedTaskCount = (int) tasks.stream()
                .filter(task -> STATUS_DONE.equals(task.status()))
                .count();
        int inProgressTaskCount = (int) tasks.stream()
                .filter(task -> STATUS_IN_PROGRESS.equals(task.status()))
                .count();
        int completionRate = totalTaskCount == 0 ? 0 : (int) Math.round(completedTaskCount * 100.0 / totalTaskCount);

        Long diagnosisId = roadmap.getDiagnosisResult() == null ? null : roadmap.getDiagnosisResult().getId();
        Long userId = roadmap.getUser() == null ? null : roadmap.getUser().getId();
        return new PlannerRoadmapDto(
                roadmap.getId(),
                userId,
                diagnosisId,
                roadmap.getTitle(),
                roadmap.getSummary(),
                roadmap.getTargetCompany(),
                roadmap.getTargetJobTitle(),
                roadmap.getReadinessStatus(),
                roadmap.getTotalScore(),
                roadmap.getDurationWeeks(),
                roadmap.getGenerationMode(),
                roadmap.getCreatedAt(),
                totalTaskCount,
                completedTaskCount,
                inProgressTaskCount,
                completionRate,
                nextAction(tasks),
                tasks
        );
    }

    private PlannerTaskDto toTaskDto(PlannerTask task) {
        return new PlannerTaskDto(
                task.getId(),
                task.getWeekNumber(),
                task.getCategory(),
                task.getTitle(),
                task.getDescription(),
                task.getExpectedOutputs(),
                task.getVerificationCriteria(),
                task.getEstimatedHours(),
                task.getDifficulty(),
                task.getStatus(),
                task.getSortOrder()
        );
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (STATUS_TODO.equals(normalized) || STATUS_IN_PROGRESS.equals(normalized) || STATUS_DONE.equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("Unsupported planner task status: " + status);
    }

    private String nextAction(List<PlannerTaskDto> tasks) {
        return tasks.stream()
                .filter(task -> !STATUS_DONE.equals(task.status()))
                .sorted(Comparator.comparing(PlannerTaskDto::weekNumber, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(PlannerTaskDto::sortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(task -> task.weekNumber() + "주차: " + task.title())
                .findFirst()
                .orElse("모든 준비 과제가 완료되었습니다. 지원 관리 단계로 이동할 수 있습니다.");
    }
}
