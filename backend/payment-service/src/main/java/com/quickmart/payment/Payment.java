package com.quickmart.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "demo_payments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_demo_payments_reference", columnNames = "reference")
})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true, length = 36)
    private String reference;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentLineItem> items = new ArrayList<>();

    protected Payment() {
    }

    public Payment(Long userId, String reference, BigDecimal total, List<PaymentItemRequest> items) {
        this.userId = userId;
        this.reference = reference;
        this.total = total;
        this.status = "DEMO_COMPLETED";
        this.createdAt = Instant.now();
        items.stream()
                .map(PaymentLineItem::new)
                .forEach(this::addItem);
    }

    private void addItem(PaymentLineItem item) {
        item.setPayment(this);
        items.add(item);
    }

    public Long getId() {
        return id;
    }

    public String getReference() {
        return reference;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Long getUserId() {
        return userId;
    }

    public List<PaymentLineItem> getItems() {
        return List.copyOf(items);
    }
}
