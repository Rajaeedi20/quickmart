package com.quickmart.payment;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class PaymentSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public PaymentSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS orders ("
                        + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, "
                        + "user_id BIGINT NOT NULL, "
                        + "order_number VARCHAR(64) NOT NULL UNIQUE, "
                        + "status VARCHAR(32) NOT NULL, "
                        + "subtotal DECIMAL(10, 2) NOT NULL, "
                        + "total DECIMAL(10, 2) NOT NULL, "
                        + "currency VARCHAR(8) NOT NULL, "
                        + "created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))");
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS order_items ("
                        + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, "
                        + "order_id BIGINT NOT NULL, "
                        + "product_id BIGINT NOT NULL, "
                        + "product_name VARCHAR(255) NOT NULL, "
                        + "unit_price DECIMAL(10, 2) NOT NULL, "
                        + "quantity INT NOT NULL, "
                        + "line_total DECIMAL(10, 2) NOT NULL, "
                        + "created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))");
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS payments ("
                        + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, "
                        + "order_id BIGINT NOT NULL, "
                        + "provider VARCHAR(32) NOT NULL, "
                        + "provider_payment_id VARCHAR(255) NOT NULL, "
                        + "idempotency_key VARCHAR(255) NOT NULL, "
                        + "amount DECIMAL(10, 2) NOT NULL, "
                        + "currency VARCHAR(8) NOT NULL, "
                        + "status VARCHAR(32) NOT NULL, "
                        + "created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), "
                        + "paid_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))");
    }
}
