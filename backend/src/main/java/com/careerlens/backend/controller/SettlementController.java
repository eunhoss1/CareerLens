package com.careerlens.backend.controller;

import com.careerlens.backend.dto.SettlementChecklistDto;
import com.careerlens.backend.dto.SettlementChecklistStatusUpdateRequestDto;
import com.careerlens.backend.dto.SettlementGuidanceDto;
import com.careerlens.backend.service.SettlementService;
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
@RequestMapping("/api/settlement")
public class SettlementController {

    private final SettlementService settlementService;

    public SettlementController(SettlementService settlementService) {
        this.settlementService = settlementService;
    }

    @GetMapping("/users/{userId}/checklists")
    public List<SettlementChecklistDto> getUserChecklists(@PathVariable Long userId) {
        return settlementService.getUserChecklists(userId);
    }

    @PostMapping("/users/{userId}/guidance")
    public SettlementGuidanceDto generateGuidance(@PathVariable Long userId) {
        return settlementService.generateGuidance(userId);
    }

    @PatchMapping("/checklists/{itemId}/status")
    public SettlementChecklistDto updateStatus(
            @PathVariable Long itemId,
            @Valid @RequestBody SettlementChecklistStatusUpdateRequestDto request
    ) {
        return settlementService.updateStatus(itemId, request.status());
    }
}
