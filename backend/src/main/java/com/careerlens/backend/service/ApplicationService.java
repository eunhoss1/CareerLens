package com.careerlens.backend.service;

import com.careerlens.backend.dto.ApplicationRecordDto;
import com.careerlens.backend.dto.ApplicationDocumentStatusDto;
import com.careerlens.backend.entity.ApplicationRecord;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PlannerRoadmap;
import com.careerlens.backend.entity.PlannerTask;
import com.careerlens.backend.entity.VerificationRequest;
import com.careerlens.backend.repository.ApplicationRecordRepository;
import com.careerlens.backend.repository.PlannerRoadmapRepository;
import com.careerlens.backend.repository.PlannerTaskRepository;
import com.careerlens.backend.repository.VerificationRequestRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    private static final String STATUS_INTERESTED = "INTERESTED";
    private static final String STATUS_PREPARING_DOCUMENTS = "PREPARING_DOCUMENTS";
    private static final String STATUS_APPLIED = "APPLIED";
    private static final String STATUS_INTERVIEW = "INTERVIEW";
    private static final String STATUS_CLOSED = "CLOSED";

    private final ApplicationRecordRepository applicationRecordRepository;
    private final PlannerRoadmapRepository plannerRoadmapRepository;
    private final PlannerTaskRepository plannerTaskRepository;
    private final VerificationRequestRepository verificationRequestRepository;

    public ApplicationService(
            ApplicationRecordRepository applicationRecordRepository,
            PlannerRoadmapRepository plannerRoadmapRepository,
            PlannerTaskRepository plannerTaskRepository,
            VerificationRequestRepository verificationRequestRepository
    ) {
        this.applicationRecordRepository = applicationRecordRepository;
        this.plannerRoadmapRepository = plannerRoadmapRepository;
        this.plannerTaskRepository = plannerTaskRepository;
        this.verificationRequestRepository = verificationRequestRepository;
    }

    @Transactional(readOnly = true)
    public List<ApplicationRecordDto> getUserApplications(Long userId) {
        return applicationRecordRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    @Transactional
    public ApplicationRecordDto createFromRoadmap(Long roadmapId) {
        ApplicationRecord existing = applicationRecordRepository.findByPlannerRoadmapId(roadmapId).orElse(null);
        if (existing != null) {
            return toDto(existing);
        }

        PlannerRoadmap roadmap = plannerRoadmapRepository.findWithDetailsById(roadmapId)
                .orElseThrow(() -> new IllegalArgumentException("Planner roadmap not found: " + roadmapId));
        if (roadmap.getDiagnosisResult() == null || roadmap.getDiagnosisResult().getJobPosting() == null) {
            throw new IllegalArgumentException("Planner roadmap is not connected to a diagnosis result.");
        }

        JobPosting job = roadmap.getDiagnosisResult().getJobPosting();
        LocalDateTime now = LocalDateTime.now();

        ApplicationRecord record = new ApplicationRecord();
        record.setUser(roadmap.getUser());
        record.setJobPosting(job);
        record.setPlannerRoadmap(roadmap);
        record.setStatus(STATUS_PREPARING_DOCUMENTS);
        record.setNextAction(nextActionFor(STATUS_PREPARING_DOCUMENTS, job));
        record.setRequiredDocuments(requiredDocumentsFor(job));
        record.setCreatedAt(now);
        record.setUpdatedAt(now);
        return toDto(applicationRecordRepository.save(record));
    }

    @Transactional
    public ApplicationRecordDto updateStatus(Long applicationId, String status) {
        ApplicationRecord record = applicationRecordRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application record not found: " + applicationId));
        String normalizedStatus = normalizeStatus(status);
        record.setStatus(normalizedStatus);
        record.setNextAction(nextActionFor(normalizedStatus, record.getJobPosting()));
        record.setUpdatedAt(LocalDateTime.now());
        return toDto(applicationRecordRepository.save(record));
    }

    private List<String> requiredDocumentsFor(JobPosting job) {
        List<String> documents = new ArrayList<>();
        documents.add("영문 이력서");
        if (Boolean.TRUE.equals(job.getPortfolioRequired())) {
            documents.add("포트폴리오");
        }
        documents.add("GitHub/프로젝트 링크");
        documents.add("어학 및 자격 증빙");
        documents.add("비자 스폰서십 확인 메모");
        return documents;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (STATUS_INTERESTED.equals(normalized)
                || STATUS_PREPARING_DOCUMENTS.equals(normalized)
                || STATUS_APPLIED.equals(normalized)
                || STATUS_INTERVIEW.equals(normalized)
                || STATUS_CLOSED.equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("Unsupported application status: " + status);
    }

    private String nextActionFor(String status, JobPosting job) {
        String baseAction = switch (status) {
            case STATUS_INTERESTED -> "추천 근거와 부족 요소를 다시 확인하고 지원 우선순위를 확정하세요.";
            case STATUS_PREPARING_DOCUMENTS -> "영문 이력서, 포트폴리오, GitHub 링크를 공고 요구사항에 맞게 정리하세요.";
            case STATUS_APPLIED -> "지원 완료일과 채용 담당자 응답 여부를 기록하고 면접 예상 질문을 준비하세요.";
            case STATUS_INTERVIEW -> "직무 경험, 프로젝트 근거, 비자 가능 여부를 면접 답변으로 정리하세요.";
            case STATUS_CLOSED -> "지원 결과와 보완점을 기록하고 다음 추천 공고에 반영하세요.";
            default -> "다음 지원 액션을 정리하세요.";
        };
        if (job == null || job.getApplicationDeadline() == null || STATUS_CLOSED.equals(status)) {
            return baseAction;
        }
        long days = ChronoUnit.DAYS.between(LocalDate.now(), job.getApplicationDeadline());
        if (days < 0) {
            return "공고 마감일이 지났습니다. 지원 결과와 보완점을 기록하고 다음 추천 공고로 전환하세요.";
        }
        if (days <= 7 && !STATUS_APPLIED.equals(status) && !STATUS_INTERVIEW.equals(status)) {
            return "마감까지 " + days + "일 남았습니다. 필수 서류와 포트폴리오 링크를 먼저 완성하고 지원 여부를 결정하세요.";
        }
        return baseAction;
    }

    private ApplicationRecordDto toDto(ApplicationRecord record) {
        JobPosting job = record.getJobPosting();
        Long roadmapId = record.getPlannerRoadmap() == null ? null : record.getPlannerRoadmap().getId();
        List<PlannerTask> tasks = roadmapId == null
                ? new ArrayList<>()
                : plannerTaskRepository.findByRoadmapIdOrderBySortOrderAsc(roadmapId);
        List<Long> taskIds = tasks.stream()
                .map(PlannerTask::getId)
                .collect(Collectors.toCollection(ArrayList::new));
        List<VerificationRequest> verifications = taskIds.isEmpty()
                ? new ArrayList<>()
                : verificationRequestRepository.findByPlannerTaskIdIn(taskIds);
        Map<Long, List<VerificationRequest>> verificationsByTaskId = verifications.stream()
                .filter(request -> request.getPlannerTask() != null)
                .collect(Collectors.groupingBy(request -> request.getPlannerTask().getId()));
        int totalTaskCount = tasks.size();
        int completedTaskCount = (int) tasks.stream().filter(this::isDone).count();
        int verifiedTaskCount = (int) tasks.stream()
                .filter(task -> hasPassingVerification(verificationsByTaskId.get(task.getId())))
                .count();
        int completionRate = totalTaskCount == 0 ? 0 : Math.round((completedTaskCount * 100.0f) / totalTaskCount);
        int verificationRate = totalTaskCount == 0 ? 0 : Math.round((verifiedTaskCount * 100.0f) / totalTaskCount);
        int matchScore = record.getPlannerRoadmap() == null || record.getPlannerRoadmap().getTotalScore() == null
                ? 0
                : record.getPlannerRoadmap().getTotalScore();
        int readinessScore = Math.min(100, Math.round(matchScore * 0.55f + completionRate * 0.30f + verificationRate * 0.15f));
        LocalDate deadline = job.getApplicationDeadline();
        Long daysUntilDeadline = deadline == null ? null : ChronoUnit.DAYS.between(LocalDate.now(), deadline);
        return new ApplicationRecordDto(
                record.getId(),
                record.getUser().getId(),
                job.getId(),
                roadmapId,
                job.getCompanyName(),
                job.getCountry(),
                job.getJobTitle(),
                job.getJobFamily(),
                job.getSalaryRange(),
                job.getWorkType(),
                record.getStatus(),
                record.getNextAction(),
                new ArrayList<>(record.getRequiredDocuments()),
                deadline,
                daysUntilDeadline,
                deadlineStatus(daysUntilDeadline),
                readinessScore,
                completionRate,
                completedTaskCount,
                totalTaskCount,
                verifiedTaskCount,
                documentChecklistFor(record, job, tasks, verifications),
                record.getCreatedAt(),
                record.getUpdatedAt()
        );
    }

    private boolean isDone(PlannerTask task) {
        String status = task.getStatus() == null ? "" : task.getStatus().trim().toUpperCase(Locale.ROOT);
        return "DONE".equals(status) || "완료".equals(status);
    }

    private boolean hasPassingVerification(List<VerificationRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return false;
        }
        return requests.stream()
                .anyMatch(request -> request.getVerificationScore() != null && request.getVerificationScore() >= 60);
    }

    private String deadlineStatus(Long daysUntilDeadline) {
        if (daysUntilDeadline == null) {
            return "ONGOING";
        }
        if (daysUntilDeadline < 0) {
            return "EXPIRED";
        }
        if (daysUntilDeadline <= 7) {
            return "URGENT";
        }
        if (daysUntilDeadline <= 21) {
            return "SOON";
        }
        return "OPEN";
    }

    private List<ApplicationDocumentStatusDto> documentChecklistFor(
            ApplicationRecord record,
            JobPosting job,
            List<PlannerTask> tasks,
            List<VerificationRequest> verifications
    ) {
        List<ApplicationDocumentStatusDto> checklist = new ArrayList<>();
        checklist.add(new ApplicationDocumentStatusDto(
                "resume",
                "영문 이력서",
                taskOrVerificationStatus(tasks, verifications, "이력서", "resume"),
                "공고 요구 기술과 프로젝트 성과가 문제-행동-결과 구조로 정리되어야 합니다."
        ));
        checklist.add(new ApplicationDocumentStatusDto(
                "portfolio",
                Boolean.TRUE.equals(job.getPortfolioRequired()) ? "포트폴리오 필수" : "포트폴리오/프로젝트 링크",
                taskOrVerificationStatus(tasks, verifications, "포트폴리오", "github"),
                Boolean.TRUE.equals(job.getPortfolioRequired())
                        ? "이 공고는 포트폴리오 제출 가능성이 높으므로 산출물 검증을 권장합니다."
                        : "프로젝트 근거가 있으면 추천 점수와 면접 준비에 유리합니다."
        ));
        checklist.add(new ApplicationDocumentStatusDto(
                "github",
                "GitHub 저장소",
                githubVerificationStatus(verifications),
                "실제 프로젝트 repository URL을 제출해 구조, README, 기술 근거를 검증합니다."
        ));
        checklist.add(new ApplicationDocumentStatusDto(
                "language",
                "어학/자격 증빙",
                STATUS_APPLIED.equals(record.getStatus()) || STATUS_INTERVIEW.equals(record.getStatus()) ? "DONE" : "TODO",
                "영어/일본어 수준, 자격증, 비자 스폰서십 메모를 지원 패키지에 정리합니다."
        ));
        return checklist;
    }

    private String taskOrVerificationStatus(List<PlannerTask> tasks, List<VerificationRequest> verifications, String koreanKeyword, String requestTypeKeyword) {
        boolean doneTask = tasks.stream()
                .filter(this::isDone)
                .anyMatch(task -> containsIgnoreCase(task.getTitle(), koreanKeyword) || containsIgnoreCase(task.getDescription(), koreanKeyword));
        if (doneTask) {
            return "DONE";
        }
        boolean verified = verifications.stream()
                .filter(request -> request.getVerificationScore() != null && request.getVerificationScore() >= 60)
                .anyMatch(request -> containsIgnoreCase(request.getRequestType(), requestTypeKeyword)
                        || containsIgnoreCase(request.getSubmittedText(), koreanKeyword));
        if (verified) {
            return "VERIFIED";
        }
        return "TODO";
    }

    private String githubVerificationStatus(List<VerificationRequest> verifications) {
        return verifications.stream()
                .filter(request -> request.getVerificationScore() != null && request.getVerificationScore() >= 75)
                .anyMatch(request -> containsIgnoreCase(request.getRequestType(), "github"))
                ? "VERIFIED"
                : "TODO";
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && keyword != null && value.toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT));
    }
}
