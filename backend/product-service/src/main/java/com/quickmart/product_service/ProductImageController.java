package com.quickmart.product;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products/images")
public class ProductImageController {

    private final ProductImageStorageService imageStorageService;

    public ProductImageController(ProductImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductImageResponse uploadImage(@RequestPart("image") MultipartFile image) {
        return new ProductImageResponse(imageStorageService.store(image));
    }
}
