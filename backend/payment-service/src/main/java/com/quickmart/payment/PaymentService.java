package com.quickmart.payment;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final ProductCatalogClient productCatalogClient;
    private final JdbcTemplate jdbcTemplate;
    private final String paymentCompletedTopic;

    public PaymentService(
            PaymentRepository paymentRepository,
            OutboxEventRepository outboxEventRepository,
            ObjectMapper objectMapper,
            ProductCatalogClient productCatalogClient,
            JdbcTemplate jdbcTemplate,
            @Value("${app.kafka.payment-completed-topic:payment.completed}") String paymentCompletedTopic) {
        this.paymentRepository = paymentRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
        this.productCatalogClient = productCatalogClient;
        this.jdbcTemplate = jdbcTemplate;
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

        List<PaymentItemRequest> verifiedItems = new ArrayList<>(request.items().size());
        for (PaymentItemRequest item : request.items()) {
            ProductCatalogItem product;
            try {
                product = productCatalogClient.getProduct(item.productId());
            } catch (HttpClientErrorException.NotFound exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Product no longer exists: " + item.productId());
            } catch (RestClientException exception) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Could not verify product prices and stock. Please try again.",
                        exception);
            }

            if (product.id() == null || !product.id().equals(item.productId())
                    || product.name() == null || product.name().isBlank()
                    || product.price() == null || product.price().signum() <= 0
                    || product.quantity() == null || product.quantity() < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Product service returned incomplete product information");
            }
            if (product.quantity() < item.quantity()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Not enough stock for " + product.name()
                                + ". Available quantity: " + product.quantity());
            }

            String trustedName = product.name().length() > 200
                    ? product.name().substring(0, 200)
                    : product.name();
            verifiedItems.add(new PaymentItemRequest(
                    product.id(),
                    trustedName,
                    item.quantity(),
                    product.price()));
        }

        BigDecimal total = verifiedItems.stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2);

        if (total.compareTo(new BigDecimal("99999999.99")) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment total exceeds the supported limit");
        }

        String orderNumber = "QM-" + UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO orders "
                        + "(user_id, order_number, status, subtotal, total, currency) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                request.userId(),
                orderNumber,
                "PAID",
                total,
                total,
                "INR");
        Long orderId = jdbcTemplate.queryForObject(
                "SELECT id FROM orders WHERE order_number = ?",
                Long.class,
                orderNumber);
        if (orderId == null) {
            throw new IllegalStateException("Could not load the newly created order");
        }

        for (PaymentItemRequest item : verifiedItems) {
            BigDecimal lineTotal = item.unitPrice()
                    .multiply(BigDecimal.valueOf(item.quantity()))
                    .setScale(2);
            jdbcTemplate.update(
                    "INSERT INTO order_items "
                            + "(order_id, product_id, product_name, unit_price, quantity, line_total) "
                            + "VALUES (?, ?, ?, ?, ?, ?)",
                    orderId,
                    item.productId(),
                    item.title(),
                    item.unitPrice(),
                    item.quantity(),
                    lineTotal);
        }

        String paymentReference = UUID.randomUUID().toString();
        jdbcTemplate.update(
                "INSERT INTO payments "
                        + "(order_id, provider, provider_payment_id, idempotency_key, "
                        + "amount, currency, status, created_at, paid_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                orderId,
                "DEMO",
                paymentReference,
                UUID.randomUUID().toString(),
                total,
                "INR",
                "SUCCESS");

        Payment payment = paymentRepository.saveAndFlush(
                new Payment(
                        request.userId(),
                        paymentReference,
                        total,
                        verifiedItems));

        PaymentCompletedEvent event = new PaymentCompletedEvent(
                UUID.randomUUID().toString(),
                payment.getId(),
                orderId,
                orderNumber,
                payment.getUserId(),
                payment.getReference(),
                payment.getTotal(),
                payment.getStatus(),
                payment.getCreatedAt(),
                verifiedItems.stream()
                        .map(item -> new PaymentCompletedItem(
                                item.productId(),
                                item.title(),
                                item.quantity()))
                        .toList());
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
                "Demo payment recorded. No real payment was charged.",
                orderNumber);
    }
}
