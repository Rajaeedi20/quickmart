package com.quickmart.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickmart.user.entity.PaymentNotification;

public interface PaymentNotificationRepository extends JpaRepository<PaymentNotification, Long> {
    boolean existsByEventId(String eventId);
}
