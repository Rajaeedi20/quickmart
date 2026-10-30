package com.quickmart.payment;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final String paymentCompletedTopic;

    public PaymentService(
            PaymentRepository paymentRepository,
            OutboxEventRepository outboxEventRepository,
            ObjectMapper objectMapper,
            @Value("${app.kafka.payment-completed-topic:payment.completed}") String paymentCompletedTopic) {
        this.paymentRepository = paymentRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
        this.paymentCompletedTopic = paymentCompletedTopic;
    }

    @Transactional
    public PaymentResponse createDemoPayment(DemoPaymentRequest request) {
        Set<Long> productIds = new HashSet<>();
        for (PaymentItemRequest item : request.items()) {
            if (!productIds.add(item.productId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Each product can appear only once in the payment request");
            }
        }

        BigDecimal total = request.items().stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2);

        if (total.compareTo(new BigDecimal("99999999.99")) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment total exceeds the supported limit");
        }

        Payment payment = paymentRepository.saveAndFlush(
                new Payment(
                        request.userId(),
                        UUID.randomUUID().toString(),
                        total,
                        request.items()));

        PaymentCompletedEvent event = new PaymentCompletedEvent(
                UUID.randomUUID().toString(),
                payment.getId(),
                payment.getUserId(),
                payment.getReference(),
                payment.getTotal(),
                payment.getStatus(),
                payment.getCreatedAt());
        try {
            outboxEventRepository.save(new OutboxEvent(
                    event.eventId(),
                    paymentCompletedTopic,
                    objectMapper.writeValueAsString(event),
                    payment));
        } catch (JacksonException exception) {
            throw new IllegalStateException("Unable to serialize payment completion event", exception);
        }

        return new PaymentResponse(
                payment.getId(),
                payment.getReference(),
                payment.getStatus(),
                payment.getTotal(),
                "Demo payment recorded. No real payment was charged.");
    }
}
