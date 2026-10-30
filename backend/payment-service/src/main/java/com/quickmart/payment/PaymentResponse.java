package com.quickmart.payment;

import java.math.BigDecimal;

public record PaymentResponse(
        Long paymentId,
        String reference,
        String status,
        BigDecimal total,
        String message) {
}
