package com.quickmart.product;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ProductSchemaMigration implements ApplicationRunner {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    private final ProductCategoryRepository categoryRepository;

    public ProductSchemaMigration(
            DataSource dataSource,
            JdbcTemplate jdbcTemplate,
            ProductCategoryRepository categoryRepository) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) throws SQLException {
        boolean hasLegacyCategory;
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            String catalog = connection.getCatalog();
            hasLegacyCategory = hasColumn(metadata, catalog, "products", "category");

            if (!hasColumn(metadata, catalog, "products", "category_id")) {
                jdbcTemplate.execute(
                        "ALTER TABLE products ADD COLUMN category_id BIGINT NULL");
            }
            if (!hasColumn(metadata, catalog, "products", "created_at")) {
                jdbcTemplate.execute(
                        "ALTER TABLE products ADD COLUMN created_at DATETIME(6) NULL");
            }
            if (!hasColumn(metadata, catalog, "product_categories", "created_at")) {
                jdbcTemplate.execute(
                        "ALTER TABLE product_categories ADD COLUMN created_at DATETIME(6) NULL");
            }
        }

        correctStoredTimestampsOnce();

        if (hasLegacyCategory) {
            List<String> legacyCategories = jdbcTemplate.queryForList(
                    "SELECT DISTINCT TRIM(category) FROM products "
                            + "WHERE category IS NOT NULL AND TRIM(category) <> ''",
                    String.class);

            for (String categoryName : legacyCategories) {
                ProductCategory category = findOrCreateCategory(categoryName);
                jdbcTemplate.update(
                        "UPDATE products SET category_id = ? "
                                + "WHERE category_id IS NULL "
                                + "AND LOWER(TRIM(category)) = LOWER(?)",
                        category.getId(),
                        categoryName);
            }
        }

        Long unassignedProducts = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM products WHERE category_id IS NULL",
                Long.class);
        if (unassignedProducts != null && unassignedProducts > 0) {
            ProductCategory uncategorized = findOrCreateCategory("Uncategorized");
            jdbcTemplate.update(
                    "UPDATE products SET category_id = ? WHERE category_id IS NULL",
                    uncategorized.getId());
        }

        if (hasLegacyCategory) {
            jdbcTemplate.execute("ALTER TABLE products DROP COLUMN category");
        }

        jdbcTemplate.execute(
                "UPDATE products SET created_at = DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 330 MINUTE) "
                        + "WHERE created_at IS NULL");
        jdbcTemplate.execute(
                "UPDATE product_categories SET created_at = "
                        + "DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 330 MINUTE) "
                        + "WHERE created_at IS NULL");
        jdbcTemplate.execute(
                "ALTER TABLE products MODIFY COLUMN description TEXT NULL");
        jdbcTemplate.execute(
                "ALTER TABLE products MODIFY COLUMN image_url TEXT NULL");
        jdbcTemplate.execute(
                "ALTER TABLE products MODIFY COLUMN category_id BIGINT NOT NULL");
        jdbcTemplate.execute(
                "ALTER TABLE products MODIFY COLUMN created_at "
                        + "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
        jdbcTemplate.execute(
                "ALTER TABLE product_categories MODIFY COLUMN created_at "
                        + "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS processed_payment_events ("
                        + "event_id VARCHAR(36) PRIMARY KEY, "
                        + "processed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))");
    }

    private void correctStoredTimestampsOnce() {
        jdbcTemplate.execute(
                        "CREATE TABLE IF NOT EXISTS quickmart_product_migrations ("
                                + "version VARCHAR(100) PRIMARY KEY, "
                                + "applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))");

        Integer alreadyApplied = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM quickmart_product_migrations WHERE version = ?",
                        Integer.class,
                        "created-at-ist-v1");
        if (alreadyApplied != null && alreadyApplied > 0) {
            return;
        }

        jdbcTemplate.update(
                        "UPDATE products SET created_at = DATE_ADD(created_at, INTERVAL 330 MINUTE)");
        jdbcTemplate.update(
                        "UPDATE product_categories SET created_at = "
                                + "DATE_ADD(created_at, INTERVAL 330 MINUTE)");
        jdbcTemplate.update(
                        "INSERT INTO quickmart_product_migrations (version) VALUES (?)",
                        "created-at-ist-v1");
    }

    private ProductCategory findOrCreateCategory(String categoryName) {
        return categoryRepository.findByCategoryNameIgnoreCase(categoryName)
                .orElseGet(() -> categoryRepository.saveAndFlush(
                        new ProductCategory(categoryName)));
    }

    private boolean hasColumn(
            DatabaseMetaData metadata,
            String catalog,
            String tableName,
            String columnName) throws SQLException {
        try (ResultSet columns = metadata.getColumns(catalog, null, tableName, columnName)) {
            return columns.next();
        }
    }
}
