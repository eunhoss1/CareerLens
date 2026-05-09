package com.careerlens.backend.controller;

import com.careerlens.backend.dto.ExternalJobImportRequestDto;
import com.careerlens.backend.dto.ExternalJobImportResponseDto;
import com.careerlens.backend.dto.ExternalJobPreviewDto;
import com.careerlens.backend.service.GreenhouseJobProviderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jobs/external")
public class ExternalJobProviderController {

    private final GreenhouseJobProviderService greenhouseJobProviderService;

    public ExternalJobProviderController(GreenhouseJobProviderService greenhouseJobProviderService) {
        this.greenhouseJobProviderService = greenhouseJobProviderService;
    }

    @GetMapping("/greenhouse/preview")
    public List<ExternalJobPreviewDto> previewGreenhouseJobs(
            @RequestParam String boardToken,
            @RequestParam(required = false) String defaultCountry,
            @RequestParam(required = false) String defaultJobFamily,
            @RequestParam(required = false) Integer limit
    ) {
        return greenhouseJobProviderService.preview(boardToken, defaultCountry, defaultJobFamily, limit);
    }

    @PostMapping("/greenhouse/import")
    public ExternalJobImportResponseDto importGreenhouseJobs(@Valid @RequestBody ExternalJobImportRequestDto request) {
        return greenhouseJobProviderService.importJobs(request);
    }
}
