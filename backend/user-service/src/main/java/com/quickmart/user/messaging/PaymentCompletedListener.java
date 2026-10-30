package com.quickmart.user.messaging;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.quickmart.user.entity.PaymentNotification;
import com.quickmart.user.entity.User;
import com.quickmart.user.repository.PaymentNotificationRepository;
import com.quickmart.user.repository.UserRepository;

@Component
public class PaymentCompletedListener {

    private static final Logger logger = LoggerFactory.getLogger(PaymentCompletedListener.class);

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final PaymentNotificationRepository notificationRepository;

    public PaymentCompletedListener(
            ObjectMapper objectMapper,
            UserRepository userRepository,
            PaymentNotificationRepository notificationRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @KafkaListener(topics = "${app.kafka.payment-completed-topic:payment.completed}")
    @Transactional
    public void handlePaymentCompleted(String payload) {
        PaymentCompletedEvent event;
        try {
            event = objectMapper.readValue(payload, PaymentCompletedEvent.class);
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("Invalid payment.completed event payload", exception);
        }

        if (notificationRepository.existsByEventId(event.eventId())) {
            logger.info("Ignoring duplicate payment event {}", event.eventId());
            return;
        }

        User user = userRepository.findById(event.userId())
                .orElseThrow(() -> new IllegalStateException(
                        "Payment event references unknown user " + event.userId()));
        notificationRepository.save(new PaymentNotification(event, user));
    }
}
