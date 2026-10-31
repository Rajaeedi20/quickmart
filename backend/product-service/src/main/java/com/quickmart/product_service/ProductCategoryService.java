package com.quickmart.product;

import java.util.List;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductCategoryService {

    private final ProductCategoryRepository categoryRepository;

    public ProductCategoryService(ProductCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<ProductCategory> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .sorted((first, second) -> first.getCategoryName()
                        .compareToIgnoreCase(second.getCategoryName()))
                .toList();
    }

    @Transactional
    public ProductCategory createCategory(ProductCategoryRequest request) {
        String categoryName = request.categoryName().trim();

        if (categoryRepository.findByCategoryNameIgnoreCase(categoryName).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This category already exists");
        }

        try {
            return categoryRepository.saveAndFlush(new ProductCategory(categoryName));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This category already exists",
                    exception);
        }
    }

    public ProductCategory findOrCreateLegacyCategory(String categoryName) {
        String normalizedName = categoryName.trim();
        return categoryRepository.findByCategoryNameIgnoreCase(normalizedName)
                .orElseGet(() -> categoryRepository.save(
                        new ProductCategory(normalizedName)));
    }
}
