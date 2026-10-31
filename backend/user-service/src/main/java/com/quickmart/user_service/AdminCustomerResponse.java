package com.quickmart.user.dto;

import java.time.LocalDateTime;

public record AdminCustomerResponse(
        Long userId,
        String name,
        String email,
        String mobile,
        LocalDateTime registeredAt) {
}
