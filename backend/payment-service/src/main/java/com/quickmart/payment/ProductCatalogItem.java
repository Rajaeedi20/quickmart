package com.quickmart.payment;

import java.math.BigDecimal;

public record ProductCatalogItem(
        Long id,
        String name,
        BigDecimal price,
        Integer quantity) {
}
