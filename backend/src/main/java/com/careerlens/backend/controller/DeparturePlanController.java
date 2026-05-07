package com.careerlens.backend.controller;

import com.careerlens.backend.dto.DeparturePlanDto;
import com.careerlens.backend.dto.DeparturePlanRequestDto;
import com.careerlens.backend.service.DeparturePlanService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departure")
public class DeparturePlanController {

    private final DeparturePlanService departurePlanService;

    public DeparturePlanController(DeparturePlanService departurePlanService) {
        this.departurePlanService = departurePlanService;
    }

    @PostMapping("/plan")
    public DeparturePlanDto generatePlan(@Valid @RequestBody DeparturePlanRequestDto request) {
        return departurePlanService.generatePlan(request);
    }
}
