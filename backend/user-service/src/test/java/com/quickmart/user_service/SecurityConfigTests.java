package com.quickmart.user_service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.quickmart.user.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

class SecurityConfigTests {

    @Test
    void allowsLocalFrontendOriginsAndConfiguredOrigin() {
        CorsConfiguration configuration = new SecurityConfig()
                .corsConfigurationSource("https://quickmart.example")
                .getCorsConfiguration(new MockHttpServletRequest("POST", "/api/admin/login"));

        assertEquals("http://localhost:5173", configuration.checkOrigin("http://localhost:5173"));
        assertEquals("http://127.0.0.1:5173", configuration.checkOrigin("http://127.0.0.1:5173"));
        assertEquals("https://quickmart.example", configuration.checkOrigin("https://quickmart.example"));
        assertNull(configuration.checkOrigin("https://untrusted.example"));
        assertNull(configuration.checkOrigin("http://localhost:5174"));
    }
}
