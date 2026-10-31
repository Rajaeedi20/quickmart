package com.quickmart.product;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductCategoryService categoryService;

    public ProductService(
            ProductRepository productRepository,
            ProductCategoryRepository categoryRepository,
            ProductCategoryService categoryService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        ProductCategory category = resolveCategory(request);
        List<Product> matchingProducts = productRepository.findByCategoryAndNameIgnoreCase(
                category.getId(),
                request.name().trim());
        List<Product> stockedMatches = matchingProducts.stream()
                .filter(product -> product.getQuantity() != null && product.getQuantity() > 0)
                .toList();
        if (stockedMatches.size() > 1
                || (stockedMatches.isEmpty() && matchingProducts.size() > 1)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Multiple products with this name and category already exist. "
                            + "Resolve the duplicate products before restocking.");
        }

        if (!stockedMatches.isEmpty() || matchingProducts.size() == 1) {
            Product existingProduct = stockedMatches.isEmpty()
                    ? matchingProducts.get(0)
                    : stockedMatches.get(0);
            try {
                existingProduct.setQuantity(
                        Math.addExact(existingProduct.getQuantity(), request.quantity()));
            } catch (ArithmeticException exception) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "The restock quantity exceeds the supported inventory limit.",
                        exception);
            }
            return toResponse(productRepository.saveAndFlush(existingProduct));
        }

        Product product = new Product(
                request.name().trim(),
                category,
                request.price(),
                request.quantity(),
                request.description(),
                request.imageUrl());
        return toResponse(productRepository.saveAndFlush(product));
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        return productRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Product not found with id: " + id
                        )
                );
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found with id: " + id));
        existingProduct.setProductCategory(resolveCategory(request));
        existingProduct.setName(request.name().trim());
        existingProduct.setPrice(request.price());
        existingProduct.setQuantity(request.quantity());
        existingProduct.setDescription(request.description());
        existingProduct.setImageUrl(request.imageUrl());
        return toResponse(productRepository.saveAndFlush(existingProduct));
    }

    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product not found with id: " + id
            );
        }

        productRepository.deleteById(id);
    }

    private ProductCategory resolveCategory(ProductRequest request) {
        if (request.categoryId() != null) {
            return categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Selected category does not exist"));
        }

        if (request.category() == null || request.category().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A category is required");
        }

        return categoryService.findOrCreateLegacyCategory(request.category().trim());
    }

    private ProductResponse toResponse(Product product) {
        ProductCategory category = product.getProductCategory();
        return new ProductResponse(
                product.getId(),
                product.getName(),
                category.getCategoryName(),
                category.getId(),
                category.getCategoryName(),
                product.getPrice(),
                product.getQuantity(),
                product.getDescription(),
                product.getImageUrl(),
                product.getCreatedAt());
    }
}