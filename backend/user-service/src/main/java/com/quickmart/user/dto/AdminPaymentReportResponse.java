package com.quickmart.user.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminPaymentReportResponse(
        Long paymentId,
        Long orderId,
        String orderNumber,
        Long customerId,
        String customerName,
        String customerEmail,
        String reference,
        BigDecimal total,
        String status,
        Instant completedAt,
        String itemsSummary) {
}
