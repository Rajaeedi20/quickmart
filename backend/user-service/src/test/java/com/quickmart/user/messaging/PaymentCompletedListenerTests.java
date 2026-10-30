package com.quickmart.user.messaging;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.quickmart.user.entity.PaymentNotification;
import com.quickmart.user.entity.User;
import com.quickmart.user.repository.PaymentNotificationRepository;
import com.quickmart.user.repository.UserRepository;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class PaymentCompletedListenerTests {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PaymentNotificationRepository notificationRepository;

    @Mock
    private User user;

    private PaymentCompletedListener listener;

    @BeforeEach
    void setUp() {
        listener = new PaymentCompletedListener(objectMapper, userRepository, notificationRepository);
    }

    @Test
    void recordsPaymentNotificationForItsUser() throws Exception {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
                "event-1",
                51L,
                12L,
                "payment-reference",
                new BigDecimal("4.25"),
                "DEMO_COMPLETED",
                Instant.parse("2026-10-26T15:31:02Z"));
        when(objectMapper.readValue("payload", PaymentCompletedEvent.class)).thenReturn(event);
        when(notificationRepository.existsByEventId(event.eventId())).thenReturn(false);
        when(userRepository.findById(event.userId())).thenReturn(Optional.of(user));

        listener.handlePaymentCompleted("payload");

        ArgumentCaptor<PaymentNotification> notificationCaptor = ArgumentCaptor.forClass(PaymentNotification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(event.eventId(), notificationCaptor.getValue().getEventId());
        org.junit.jupiter.api.Assertions.assertEquals(event.paymentId(), notificationCaptor.getValue().getPaymentId());
        org.junit.jupiter.api.Assertions.assertEquals(event.total(), notificationCaptor.getValue().getTotal());
        org.junit.jupiter.api.Assertions.assertEquals(event.status(), notificationCaptor.getValue().getStatus());
    }

    @Test
    void ignoresDuplicateEvents() throws Exception {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
                "event-1",
                51L,
                12L,
                "payment-reference",
                new BigDecimal("4.25"),
                "DEMO_COMPLETED",
                Instant.parse("2026-10-26T15:31:02Z"));
        when(objectMapper.readValue("payload", PaymentCompletedEvent.class)).thenReturn(event);
        when(notificationRepository.existsByEventId(event.eventId())).thenReturn(true);

        listener.handlePaymentCompleted("payload");

        verify(userRepository, never()).findById(any());
        verify(notificationRepository, never()).save(any(PaymentNotification.class));
    }
}
