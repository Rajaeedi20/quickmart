package com.quickmart.product;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductCategoryRequest(
        @JsonAlias("category_name")
        @NotBlank(message = "Category name is required")
        @Size(max = 255, message = "Category name must be 255 characters or fewer")
        String categoryName) {
}
