package com.quickmart.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTests {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private ObjectMapper objectMapper;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                outboxEventRepository,
                objectMapper,
                "payment.completed");
    }

    @Test
    void calculatesAndPersistsDemoPaymentTotal() {
        when(objectMapper.writeValueAsString(any(PaymentCompletedEvent.class))).thenReturn("{}");
        when(paymentRepository.saveAndFlush(any(Payment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.createDemoPayment(
                new DemoPaymentRequest(
                        12L,
                        List.of(
                                new PaymentItemRequest(2L, "Apples", 2, new BigDecimal("1.25")),
                                new PaymentItemRequest(3L, "Milk", 1, new BigDecimal("3.50")))));

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).saveAndFlush(paymentCaptor.capture());

        assertEquals(new BigDecimal("6.00"), response.total());
        assertEquals(new BigDecimal("6.00"), paymentCaptor.getValue().getTotal());
        assertEquals("DEMO_COMPLETED", response.status());
        assertEquals("DEMO_COMPLETED", paymentCaptor.getValue().getStatus());
        assertEquals(12L, paymentCaptor.getValue().getUserId());
        assertEquals(2, paymentCaptor.getValue().getItems().size());
        assertEquals(2, paymentCaptor.getValue().getItems().get(0).getQuantity());
        assertEquals("Apples", paymentCaptor.getValue().getItems().get(0).getTitle());
        assertEquals(new BigDecimal("2.50"), paymentCaptor.getValue().getItems().get(0).getLineTotal());
        verify(outboxEventRepository).save(any(OutboxEvent.class));
    }

    @Test
    void rejectsDuplicateProductIdsWithoutSavingPayment() {
        DemoPaymentRequest request = new DemoPaymentRequest(
                12L,
                List.of(
                        new PaymentItemRequest(2L, "Apples", 1, new BigDecimal("1.25")),
                        new PaymentItemRequest(2L, "Apples", 1, new BigDecimal("1.25"))));

        assertThrows(
                ResponseStatusException.class,
                () -> paymentService.createDemoPayment(request));
        verifyNoInteractions(paymentRepository);
        verifyNoInteractions(outboxEventRepository);
    }
}
