package com.quickmart.product;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {

    Optional<ProductCategory> findByCategoryNameIgnoreCase(String categoryName);
}
