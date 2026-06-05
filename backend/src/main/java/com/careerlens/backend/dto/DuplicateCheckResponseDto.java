package com.careerlens.backend.dto;

public record DuplicateCheckResponseDto(
        boolean available,
        String message
) {
}
