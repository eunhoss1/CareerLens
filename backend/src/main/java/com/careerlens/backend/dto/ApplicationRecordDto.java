package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ApplicationRecordDto(
        @JsonProperty("application_id")
        Long applicationId,
        @JsonProperty("user_id")
        Long userId,
        @JsonProperty("job_id")
        Long jobId,
        @JsonProperty("roadmap_id")
        Long roadmapId,
        @JsonProperty("company_name")
        String companyName,
        String country,
        @JsonProperty("job_title")
        String jobTitle,
        @JsonProperty("job_family")
        String jobFamily,
        @JsonProperty("salary_range")
        String salaryRange,
        @JsonProperty("work_type")
        String workType,
        String status,
        @JsonProperty("next_action")
        String nextAction,
        @JsonProperty("required_documents")
        List<String> requiredDocuments,
        @JsonProperty("application_deadline")
        LocalDate applicationDeadline,
        @JsonProperty("days_until_deadline")
        Long daysUntilDeadline,
        @JsonProperty("deadline_status")
        String deadlineStatus,
        @JsonProperty("readiness_score")
        Integer readinessScore,
        @JsonProperty("roadmap_completion_rate")
        Integer roadmapCompletionRate,
        @JsonProperty("completed_task_count")
        Integer completedTaskCount,
        @JsonProperty("total_task_count")
        Integer totalTaskCount,
        @JsonProperty("verified_task_count")
        Integer verifiedTaskCount,
        @JsonProperty("document_checklist")
        List<ApplicationDocumentStatusDto> documentChecklist,
        @JsonProperty("created_at")
        LocalDateTime createdAt,
        @JsonProperty("updated_at")
        LocalDateTime updatedAt
) {
}
