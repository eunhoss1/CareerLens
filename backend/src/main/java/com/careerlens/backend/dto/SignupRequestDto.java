package com.careerlens.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequestDto(
        @NotBlank String loginId,
        @NotBlank String displayName,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 4, message = "Password must be at least 4 characters for demo login.") String password
) {
}
