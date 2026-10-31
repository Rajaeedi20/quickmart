package com.quickmart.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String category,
        Long categoryId,
        String categoryName,
        BigDecimal price,
        Integer quantity,
        String description,
        String imageUrl,
        LocalDateTime createdAt) {
}
