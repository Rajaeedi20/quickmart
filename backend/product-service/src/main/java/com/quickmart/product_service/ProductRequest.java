package com.quickmart.product;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductRequest(
        @NotBlank(message = "Product name is required")
        @Size(max = 255, message = "Product name must be 255 characters or fewer")
        String name,
        @JsonAlias("category_id")
        Long categoryId,
        @JsonAlias("category_name")
        String category,
        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than zero")
        BigDecimal price,
        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        Integer quantity,
        String description,
        @JsonAlias("image_url")
        String imageUrl) {
}
