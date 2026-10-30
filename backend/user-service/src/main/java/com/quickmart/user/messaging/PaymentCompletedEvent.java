package com.quickmart.user.messaging;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentCompletedEvent(
        String eventId,
        Long paymentId,
        Long userId,
        String reference,
        BigDecimal total,
        String status,
        Instant completedAt) {
}
