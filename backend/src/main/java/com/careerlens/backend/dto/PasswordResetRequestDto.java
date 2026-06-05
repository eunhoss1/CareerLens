package com.careerlens.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetRequestDto(
        @NotBlank String loginIdOrEmail,
        @NotBlank String displayName,
        @Email @NotBlank String email,
        @NotBlank
        @Size(min = 8, message = "Password must be at least 8 characters.")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$", message = "Password must include letters, numbers, and special characters.")
        String newPassword,
        @NotBlank String newPasswordConfirm
) {
}
