package com.careerlens.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record FindLoginIdRequestDto(
        @NotBlank String displayName,
        @Email @NotBlank String email
) {
}
