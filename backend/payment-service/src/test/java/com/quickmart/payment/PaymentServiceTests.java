package com.quickmart.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
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
import org.springframework.jdbc.core.JdbcTemplate;
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

    @Mock
    private ProductCatalogClient productCatalogClient;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                outboxEventRepository,
                objectMapper,
                productCatalogClient,
                jdbcTemplate,
                "payment.completed");
    }

    @Test
    void calculatesAndPersistsDemoPaymentTotal() {
        when(objectMapper.writeValueAsString(any(PaymentCompletedEvent.class))).thenReturn("{}");
        when(paymentRepository.saveAndFlush(any(Payment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(productCatalogClient.getProduct(2L))
                .thenReturn(new ProductCatalogItem(2L, "Apples", new BigDecimal("1.25"), 10));
        when(productCatalogClient.getProduct(3L))
                .thenReturn(new ProductCatalogItem(3L, "Milk", new BigDecimal("3.50"), 10));
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), startsWith("QM-")))
                .thenReturn(101L);

        PaymentResponse response = paymentService.createDemoPayment(
                new DemoPaymentRequest(
                        12L,
                        List.of(
                                new PaymentItemRequest(2L, "Client price", 2, new BigDecimal("99.99")),
                                new PaymentItemRequest(3L, "Client price", 1, new BigDecimal("0.01")))));

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).saveAndFlush(paymentCaptor.capture());
        ArgumentCaptor<PaymentCompletedEvent> eventCaptor =
                ArgumentCaptor.forClass(PaymentCompletedEvent.class);
        verify(objectMapper).writeValueAsString(eventCaptor.capture());

        assertEquals(new BigDecimal("6.00"), response.total());
        org.junit.jupiter.api.Assertions.assertTrue(response.orderNumber().startsWith("QM-"));
        assertEquals(response.orderNumber(), eventCaptor.getValue().orderNumber());
        assertEquals(2, eventCaptor.getValue().items().size());
        assertEquals("Apples", eventCaptor.getValue().items().get(0).title());
        assertEquals(new BigDecimal("6.00"), paymentCaptor.getValue().getTotal());
        assertEquals("DEMO_COMPLETED", response.status());
        assertEquals("DEMO_COMPLETED", paymentCaptor.getValue().getStatus());
        assertEquals(12L, paymentCaptor.getValue().getUserId());
        assertEquals(2, paymentCaptor.getValue().getItems().size());
        assertEquals(2, paymentCaptor.getValue().getItems().get(0).getQuantity());
        assertEquals("Apples", paymentCaptor.getValue().getItems().get(0).getTitle());
        assertEquals(new BigDecimal("2.50"), paymentCaptor.getValue().getItems().get(0).getLineTotal());
        verify(outboxEventRepository).save(any(OutboxEvent.class));
        verify(jdbcTemplate).update(
                org.mockito.ArgumentMatchers.contains("INSERT INTO orders"),
                org.mockito.ArgumentMatchers.eq(12L),
                org.mockito.ArgumentMatchers.startsWith("QM-"),
                org.mockito.ArgumentMatchers.eq("PAID"),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("6.00")),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("6.00")),
                org.mockito.ArgumentMatchers.eq("INR"));
        verify(jdbcTemplate).update(
                org.mockito.ArgumentMatchers.contains("INSERT INTO order_items"),
                org.mockito.ArgumentMatchers.eq(101L),
                org.mockito.ArgumentMatchers.eq(2L),
                org.mockito.ArgumentMatchers.eq("Apples"),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("1.25")),
                org.mockito.ArgumentMatchers.eq(2),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("2.50")));
        verify(jdbcTemplate).update(
                org.mockito.ArgumentMatchers.contains("INSERT INTO payments"),
                org.mockito.ArgumentMatchers.eq(101L),
                org.mockito.ArgumentMatchers.eq("DEMO"),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("6.00")),
                org.mockito.ArgumentMatchers.eq("INR"),
                org.mockito.ArgumentMatchers.eq("SUCCESS"));
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

    @Test
    void usesCatalogPriceAndRejectsInsufficientStock() {
        when(productCatalogClient.getProduct(2L))
                .thenReturn(new ProductCatalogItem(2L, "Apples", new BigDecimal("1.25"), 1));
        DemoPaymentRequest request = new DemoPaymentRequest(
                12L,
                List.of(new PaymentItemRequest(2L, "Client name", 2, new BigDecimal("0.01"))));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.createDemoPayment(request));

        assertEquals(409, exception.getStatusCode().value());
        verifyNoInteractions(paymentRepository, outboxEventRepository, jdbcTemplate);
    }
}
