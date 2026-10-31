package com.quickmart.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    @Override
    @EntityGraph(attributePaths = "productCategory")
    java.util.List<Product> findAll();

    @EntityGraph(attributePaths = "productCategory")
    @Query("""
            SELECT product FROM Product product
            WHERE product.productCategory.id = :categoryId
              AND LOWER(TRIM(product.name)) = LOWER(TRIM(:name))
            ORDER BY product.id
            """)
    List<Product> findByCategoryAndNameIgnoreCase(
            @Param("categoryId") Long categoryId,
            @Param("name") String name);
}