package com.careerlens.backend.dto;

public record FindLoginIdResponseDto(
        String maskedLoginId,
        String message
) {
}
