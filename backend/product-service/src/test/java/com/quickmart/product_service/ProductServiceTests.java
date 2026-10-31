package com.quickmart.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ProductServiceTests {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductCategoryRepository categoryRepository;

    @Mock
    private ProductCategoryService categoryService;

    private ProductService productService;
    private ProductCategory bakery;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, categoryRepository, categoryService);
        bakery = new ProductCategory("Bakery");
        ReflectionTestUtils.setField(bakery, "id", 7L);
    }

    @Test
    void addingExistingProductIncreasesStockInsteadOfCreatingDuplicate() {
        Product existingCake = new Product(
                "Cake",
                bakery,
                new BigDecimal("250.00"),
                0,
                "Chocolate cake",
                "/images/cake.jpg");
        existingCake.setId(42L);
        when(categoryRepository.findById(7L)).thenReturn(Optional.of(bakery));
        when(productRepository.findByCategoryAndNameIgnoreCase(7L, "Cake"))
                .thenReturn(List.of(existingCake));
        when(productRepository.saveAndFlush(existingCake)).thenReturn(existingCake);

        ProductResponse response = productService.createProduct(
                new ProductRequest(
                        " Cake ",
                        7L,
                        null,
                        new BigDecimal("300.00"),
                        5,
                        "New description",
                        "/images/new-cake.jpg"));

        assertEquals(42L, response.id());
        assertEquals(5, response.quantity());
        assertEquals(new BigDecimal("250.00"), response.price());
        verify(productRepository).saveAndFlush(existingCake);
    }

    @Test
    void refusesToRestockWhenDuplicateRecordsAlreadyExist() {
        Product firstCake = new Product("Cake", bakery, BigDecimal.TEN, 3, null, null);
        Product secondCake = new Product("cake", bakery, BigDecimal.TEN, 2, null, null);
        when(categoryRepository.findById(7L)).thenReturn(Optional.of(bakery));
        when(productRepository.findByCategoryAndNameIgnoreCase(7L, "Cake"))
                .thenReturn(List.of(firstCake, secondCake));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> productService.createProduct(
                        new ProductRequest(
                                "Cake",
                                7L,
                                null,
                                BigDecimal.TEN,
                                5,
                                null,
                                null)));

        assertEquals(409, exception.getStatusCode().value());
        verify(productRepository, never()).saveAndFlush(any(Product.class));
    }

    @Test
    void restocksTheSingleAvailableMatchWhenAnOldDuplicateIsOutOfStock() {
        Product oldCake = new Product("Cake", bakery, new BigDecimal("600.00"), 0, null, null);
        Product availableCake = new Product("Cake", bakery, new BigDecimal("500.00"), 30, null, null);
        availableCake.setId(43L);
        when(categoryRepository.findById(7L)).thenReturn(Optional.of(bakery));
        when(productRepository.findByCategoryAndNameIgnoreCase(7L, "Cake"))
                .thenReturn(List.of(oldCake, availableCake));
        when(productRepository.saveAndFlush(availableCake)).thenReturn(availableCake);

        ProductResponse response = productService.createProduct(
                new ProductRequest(
                        "Cake",
                        7L,
                        null,
                        new BigDecimal("600.00"),
                        5,
                        null,
                        null));

        assertEquals(43L, response.id());
        assertEquals(35, response.quantity());
        assertEquals(new BigDecimal("500.00"), response.price());
        verify(productRepository).saveAndFlush(availableCake);
    }
}
