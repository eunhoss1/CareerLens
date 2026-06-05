package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetGuideRequestDto(
        @NotBlank String loginIdOrEmail
) {
}
