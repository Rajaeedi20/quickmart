package com.quickmart.user.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import com.quickmart.user.messaging.PaymentCompletedEvent;
import com.quickmart.user.messaging.PaymentCompletedItem;

@Entity
@Table(name = "payment_notifications", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_notification_event_id", columnNames = "event_id")
})
public class PaymentNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, length = 36)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "payment_id", nullable = false)
    private Long paymentId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "order_number", length = 40)
    private String orderNumber;

    @Column(nullable = false, length = 36)
    private String reference;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "items_summary", nullable = false, columnDefinition = "TEXT")
    private String itemsSummary;

    protected PaymentNotification() {
    }

    public PaymentNotification(PaymentCompletedEvent event, User user) {
        this.eventId = event.eventId();
        this.user = user;
        this.paymentId = event.paymentId();
        this.orderId = event.orderId();
        this.orderNumber = event.orderNumber();
        this.reference = event.reference();
        this.total = event.total();
        this.status = event.status();
        this.completedAt = event.completedAt();
        this.recordedAt = Instant.now();
        this.itemsSummary = (event.items() == null ? List.<PaymentCompletedItem>of() : event.items()).stream()
                .map(item -> item.title() + " x " + item.quantity())
                .collect(Collectors.joining(", "));
    }

    public String getEventId() {
        return eventId;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public String getReference() {
        return reference;
    }

    public String getItemsSummary() {
        return itemsSummary;
    }

    public Long getUserId() {
        return user.getId();
    }

    public String getCustomerName() {
        return user.getName();
    }

    public String getCustomerEmail() {
        return user.getEmail();
    }

    public BigDecimal getTotal() {
        return total;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }
}
