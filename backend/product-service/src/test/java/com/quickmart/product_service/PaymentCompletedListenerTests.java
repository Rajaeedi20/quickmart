package com.quickmart.product;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class PaymentCompletedListenerTests {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private PaymentCompletedListener listener;

    @BeforeEach
    void setUp() {
        listener = new PaymentCompletedListener(objectMapper, jdbcTemplate);
    }

    @Test
    void deductsStockAndRecordsProcessedEvent() throws Exception {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
                "event-1",
                51L,
                91L,
                "QM-order-91",
                12L,
                "payment-reference",
                new BigDecimal("4.25"),
                "DEMO_COMPLETED",
                Instant.parse("2026-10-26T15:31:02Z"),
                List.of(new PaymentCompletedItem(2L, "Apples", 2)));
        when(objectMapper.readValue("payload", PaymentCompletedEvent.class)).thenReturn(event);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(event.eventId())))
                .thenReturn(0);
        when(jdbcTemplate.update(contains("UPDATE products"), eq(2), eq(2L), eq(2)))
                .thenReturn(1);

        listener.handlePaymentCompleted("payload");

        verify(jdbcTemplate).update(
                contains("UPDATE products"),
                eq(2),
                eq(2L),
                eq(2));
        verify(jdbcTemplate).update(
                contains("INSERT INTO processed_payment_events"),
                eq(event.eventId()));
    }

    @Test
    void doesNotDeductStockForDuplicateEvent() throws Exception {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
                "event-1",
                51L,
                91L,
                "QM-order-91",
                12L,
                "payment-reference",
                new BigDecimal("4.25"),
                "DEMO_COMPLETED",
                Instant.parse("2026-10-26T15:31:02Z"),
                List.of(new PaymentCompletedItem(2L, "Apples", 2)));
        when(objectMapper.readValue("payload", PaymentCompletedEvent.class)).thenReturn(event);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(event.eventId())))
                .thenReturn(1);

        listener.handlePaymentCompleted("payload");

        verify(jdbcTemplate, never()).update(contains("UPDATE products"), eq(2), eq(2L), eq(2));
    }
}
