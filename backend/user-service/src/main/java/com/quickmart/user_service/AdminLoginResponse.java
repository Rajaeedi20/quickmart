package com.quickmart.user.dto;

public record AdminLoginResponse(
        String message,
        String name,
        String email,
        String role) {
}
