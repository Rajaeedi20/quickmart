package com.quickmart.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class HttpProductCatalogClient implements ProductCatalogClient {

    private final RestClient restClient;

    public HttpProductCatalogClient(
            @Value("${app.product-service.url}") String productServiceUrl) {
        this.restClient = RestClient.create(productServiceUrl);
    }

    @Override
    public ProductCatalogItem getProduct(Long productId) {
        ProductCatalogItem product = restClient.get()
                .uri("/api/products/{id}", productId)
                .retrieve()
                .body(ProductCatalogItem.class);
        if (product == null) {
            throw new IllegalStateException(
                    "Product service returned an empty response for product " + productId);
        }
        return product;
    }
}
