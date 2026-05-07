package com.careerlens.backend.controller;

import com.careerlens.backend.dto.PlannerRoadmapDto;
import com.careerlens.backend.dto.PlannerTaskStatusUpdateRequestDto;
import com.careerlens.backend.service.PlannerService;
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
@RequestMapping("/api/planner")
public class PlannerController {

    private final PlannerService plannerService;

    public PlannerController(PlannerService plannerService) {
        this.plannerService = plannerService;
    }

    @PostMapping("/roadmaps/from-diagnosis/{diagnosisId}")
    public PlannerRoadmapDto createFromDiagnosis(@PathVariable Long diagnosisId) {
        return plannerService.createFromDiagnosis(diagnosisId);
    }

    @GetMapping("/roadmaps/{roadmapId}")
    public PlannerRoadmapDto getRoadmap(@PathVariable Long roadmapId) {
        return plannerService.getRoadmap(roadmapId);
    }

    @GetMapping("/users/{userId}/roadmaps")
    public List<PlannerRoadmapDto> getUserRoadmaps(@PathVariable Long userId) {
        return plannerService.getUserRoadmaps(userId);
    }

    @PatchMapping("/tasks/{taskId}/status")
    public PlannerRoadmapDto updateTaskStatus(
            @PathVariable Long taskId,
            @Valid @RequestBody PlannerTaskStatusUpdateRequestDto request
    ) {
        return plannerService.updateTaskStatus(taskId, request.status());
    }
}
