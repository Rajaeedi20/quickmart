package com.quickmart.product;

public record PaymentCompletedItem(
        Long productId,
        String title,
        int quantity) {
}
