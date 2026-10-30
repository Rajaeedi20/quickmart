package com.quickmart.user.dto;

public record AuthResponse(
    String message,
    Long userId,
    String name,
    String email
) {
}