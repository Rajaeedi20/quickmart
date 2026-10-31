package com.quickmart.product;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentCompletedListener {

    private static final Logger logger = LoggerFactory.getLogger(PaymentCompletedListener.class);

    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    public PaymentCompletedListener(ObjectMapper objectMapper, JdbcTemplate jdbcTemplate) {
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
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

        if (!"DEMO_COMPLETED".equals(event.status())) {
            logger.info("Ignoring non-completed payment event {}", event.eventId());
            return;
        }
        if (event.eventId() == null || event.items() == null || event.items().isEmpty()) {
            logger.warn(
                    "Ignoring legacy payment event {} without item details",
                    event.eventId());
            return;
        }

        Integer alreadyProcessed = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM processed_payment_events WHERE event_id = ?",
                Integer.class,
                event.eventId());
        if (alreadyProcessed != null && alreadyProcessed > 0) {
            logger.info("Ignoring duplicate payment event {}", event.eventId());
            return;
        }

        for (PaymentCompletedItem item : event.items()) {
            int updatedRows = jdbcTemplate.update(
                    "UPDATE products SET quantity = quantity - ? "
                            + "WHERE id = ? AND quantity >= ?",
                    item.quantity(),
                    item.productId(),
                    item.quantity());
            if (updatedRows != 1) {
                throw new IllegalStateException(
                        "Could not deduct purchased stock for product " + item.productId()
                                + " from payment " + event.reference()
                                + "; stock may be insufficient or the product may be missing");
            }
        }

        jdbcTemplate.update(
                "INSERT INTO processed_payment_events (event_id) VALUES (?)",
                event.eventId());
        logger.info(
                "Applied inventory deduction for order {} ({} items)",
                event.orderNumber(),
                event.items().size());
    }
}
