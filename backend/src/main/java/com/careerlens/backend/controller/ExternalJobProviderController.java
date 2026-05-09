package com.careerlens.backend.controller;

import com.careerlens.backend.dto.ExternalJobImportRequestDto;
import com.careerlens.backend.dto.ExternalJobImportResponseDto;
import com.careerlens.backend.dto.ExternalJobPreviewDto;
import com.careerlens.backend.dto.ExternalJobSyncStatusDto;
import com.careerlens.backend.service.GreenhouseJobProviderService;
import com.careerlens.backend.service.GreenhouseJobSyncService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/jobs/external")
public class ExternalJobProviderController {

    private final GreenhouseJobProviderService greenhouseJobProviderService;
    private final GreenhouseJobSyncService greenhouseJobSyncService;

    public ExternalJobProviderController(
            GreenhouseJobProviderService greenhouseJobProviderService,
            GreenhouseJobSyncService greenhouseJobSyncService
    ) {
        this.greenhouseJobProviderService = greenhouseJobProviderService;
        this.greenhouseJobSyncService = greenhouseJobSyncService;
    }

    @GetMapping("/greenhouse/preview")
    public List<ExternalJobPreviewDto> previewGreenhouseJobs(
            @RequestHeader(value = "X-Careerlens-User-Role", required = false) String role,
            @RequestParam String boardToken,
            @RequestParam(required = false) String defaultCountry,
            @RequestParam(required = false) String defaultJobFamily,
            @RequestParam(required = false) Integer limit
    ) {
        assertAdmin(role);
        return greenhouseJobProviderService.preview(boardToken, defaultCountry, defaultJobFamily, limit);
    }

    @PostMapping("/greenhouse/import")
    public ExternalJobImportResponseDto importGreenhouseJobs(
            @RequestHeader(value = "X-Careerlens-User-Role", required = false) String role,
            @Valid @RequestBody ExternalJobImportRequestDto request
    ) {
        assertAdmin(role);
        return greenhouseJobProviderService.importJobs(request);
    }

    @PostMapping("/greenhouse/sync/run")
    public ExternalJobSyncStatusDto runGreenhouseSync(@RequestHeader(value = "X-Careerlens-User-Role", required = false) String role) {
        assertAdmin(role);
        return greenhouseJobSyncService.runSync();
    }

    @GetMapping("/greenhouse/sync/status")
    public ExternalJobSyncStatusDto getGreenhouseSyncStatus(@RequestHeader(value = "X-Careerlens-User-Role", required = false) String role) {
        assertAdmin(role);
        return greenhouseJobSyncService.status();
    }

    private void assertAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요한 기능입니다.");
        }
    }
}
