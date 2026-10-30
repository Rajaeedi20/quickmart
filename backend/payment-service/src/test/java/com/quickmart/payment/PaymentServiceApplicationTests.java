package com.quickmart.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class PaymentServiceApplicationTests {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private PaymentService paymentService;

	@Test
	void contextLoads() {
	}

	@Test
	@Transactional
	void persistsPaymentAndItemsWithUserIdInItsOwnDatabase() {
		Long userId = 987654L;

		PaymentResponse response = paymentService.createDemoPayment(
				new DemoPaymentRequest(
						userId,
						List.of(new PaymentItemRequest(
								42L, "Payment test item", 2, new BigDecimal("1.25")))));

		assertNotNull(response.paymentId());
		assertEquals(new BigDecimal("2.50"), response.total());
		assertEquals(
				1,
				jdbcTemplate.queryForObject(
						"SELECT COUNT(*) FROM demo_payments WHERE id = ? AND user_id = ?",
						Integer.class,
						response.paymentId(),
						userId));
		assertEquals(
				1,
				jdbcTemplate.queryForObject(
						"SELECT COUNT(*) FROM demo_payment_items WHERE payment_id = ? "
								+ "AND product_id = ? AND quantity = ? AND line_total = ?",
						Integer.class,
						response.paymentId(),
						42L,
						2,
						new BigDecimal("2.50")));
	}

}
