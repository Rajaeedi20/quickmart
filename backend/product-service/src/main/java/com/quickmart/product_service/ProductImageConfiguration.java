package com.quickmart.product;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ProductImageConfiguration implements WebMvcConfigurer {

    private final String imageDirectory;

    public ProductImageConfiguration(
            @Value("${app.product-images.directory:uploads/products}") String imageDirectory) {
        String location = Path.of(imageDirectory)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();
        this.imageDirectory = location.endsWith("/") ? location : location + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations(imageDirectory);
    }
}
