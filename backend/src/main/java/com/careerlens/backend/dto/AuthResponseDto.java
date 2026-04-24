package com.careerlens.backend.dto;

public record AuthResponseDto(
        Long userId,
        String loginId,
        String displayName,
        String email,
        Boolean profileCompleted
) {
}
