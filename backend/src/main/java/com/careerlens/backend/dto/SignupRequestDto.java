package com.careerlens.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequestDto(
        @NotBlank
        @Pattern(regexp = "^[a-zA-Z0-9._-]{4,30}$", message = "Login ID must be 4-30 characters using letters, numbers, dot, underscore, or hyphen.")
        String loginId,
        @NotBlank @Size(max = 40) String displayName,
        @Email @NotBlank String email,
        @NotBlank
        @Size(min = 8, message = "Password must be at least 8 characters.")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$", message = "Password must include letters, numbers, and special characters.")
        String password,
        @NotBlank String passwordConfirm,
        @AssertTrue(message = "Terms must be accepted.") Boolean termsAccepted
) {
}
