package com.quickmart.user.messaging;

public record PaymentCompletedItem(
        Long productId,
        String title,
        int quantity) {
}
