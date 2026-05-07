package com.careerlens.backend.controller;

import com.careerlens.backend.dto.ApplicationRecordDto;
import com.careerlens.backend.dto.ApplicationStatusUpdateRequestDto;
import com.careerlens.backend.service.ApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping("/users/{userId}")
    public List<ApplicationRecordDto> getUserApplications(@PathVariable Long userId) {
        return applicationService.getUserApplications(userId);
    }

    @PostMapping("/from-roadmap/{roadmapId}")
    public ApplicationRecordDto createFromRoadmap(@PathVariable Long roadmapId) {
        return applicationService.createFromRoadmap(roadmapId);
    }

    @PatchMapping("/{applicationId}/status")
    public ApplicationRecordDto updateStatus(
            @PathVariable Long applicationId,
            @Valid @RequestBody ApplicationStatusUpdateRequestDto request
    ) {
        return applicationService.updateStatus(applicationId, request.status());
    }
}
