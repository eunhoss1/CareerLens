package com.careerlens.backend.dto;

public record AuthResponseDto(
        Long userId,
        String loginId,
        String displayName,
        String email,
        String role,
        Boolean admin,
        Boolean profileCompleted
) {
}
