package com.quickmart.payment;

public record PaymentCompletedItem(
        Long productId,
        String title,
        int quantity) {
}
