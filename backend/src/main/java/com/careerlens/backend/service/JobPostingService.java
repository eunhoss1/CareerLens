package com.careerlens.backend.service;

import com.careerlens.backend.dto.JobPostingDto;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.repository.JobPostingRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;

    public JobPostingService(JobPostingRepository jobPostingRepository) {
        this.jobPostingRepository = jobPostingRepository;
    }

    @Transactional(readOnly = true)
    public List<JobPostingDto> getAllJobs() {
        return jobPostingRepository.findAllByOrderByCountryAscJobFamilyAscCompanyNameAscJobTitleAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public JobPostingDto toDto(JobPosting job) {
        LocalDate today = LocalDate.now();
        LocalDate deadline = job.getApplicationDeadline();
        Integer daysUntilDeadline = deadline == null ? null : (int) ChronoUnit.DAYS.between(today, deadline);
        return new JobPostingDto(
                job.getId(),
                job.getExternalRef(),
                job.getCompanyName(),
                job.getCountry(),
                job.getJobTitle(),
                job.getJobFamily(),
                mutableList(job.getRequiredSkills()),
                mutableList(job.getPreferredSkills()),
                mutableList(job.getRequiredLanguages()),
                job.getMinExperienceYears(),
                job.getDegreeRequirement(),
                job.getPortfolioRequired(),
                job.getVisaRequirement(),
                job.getSalaryRange(),
                job.getWorkType(),
                deadline,
                deadlineStatus(daysUntilDeadline),
                daysUntilDeadline,
                job.getSalaryScore(),
                job.getWorkLifeBalanceScore(),
                job.getCompanyValueScore(),
                job.getEvaluationRationale()
        );
    }

    private String deadlineStatus(Integer daysUntilDeadline) {
        if (daysUntilDeadline == null) {
            return "ROLLING";
        }
        if (daysUntilDeadline < 0) {
            return "CLOSED";
        }
        if (daysUntilDeadline <= 7) {
            return "URGENT";
        }
        if (daysUntilDeadline <= 21) {
            return "CLOSING_SOON";
        }
        return "OPEN";
    }

    private List<String> mutableList(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }
}
