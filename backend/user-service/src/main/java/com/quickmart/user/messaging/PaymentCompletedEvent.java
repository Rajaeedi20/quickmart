package com.quickmart.user.messaging;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PaymentCompletedEvent(
        String eventId,
        Long paymentId,
        Long orderId,
        String orderNumber,
        Long userId,
        String reference,
        BigDecimal total,
        String status,
        Instant completedAt,
        List<PaymentCompletedItem> items) {
}
