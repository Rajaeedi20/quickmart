package com.quickmart.user.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.quickmart.user.entity.PaymentNotification;

public record CustomerPurchaseResponse(
        Long paymentId,
        Long orderId,
        String orderNumber,
        String reference,
        BigDecimal total,
        String status,
        Instant paidAt,
        String itemsSummary) {

    public static CustomerPurchaseResponse from(PaymentNotification notification) {
        return new CustomerPurchaseResponse(
                notification.getPaymentId(),
                notification.getOrderId(),
                notification.getOrderNumber(),
                notification.getReference(),
                notification.getTotal(),
                notification.getStatus(),
                notification.getCompletedAt(),
                notification.getItemsSummary());
    }
}
