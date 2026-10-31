package com.quickmart.user_service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.quickmart.user.controller.AuthController;
import com.quickmart.user.dto.LoginRequest;
import com.quickmart.user.entity.User;
import com.quickmart.user.repository.PaymentNotificationRepository;
import com.quickmart.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthControllerTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SecurityContextRepository securityContextRepository;

    @Mock
    private PaymentNotificationRepository paymentNotificationRepository;

    private AuthController controller;
    private User customer;

    @BeforeEach
    void setUp() {
        controller = new AuthController(
                userRepository,
                passwordEncoder,
                securityContextRepository,
                paymentNotificationRepository);
        customer = new User("QuickMart Customer", "9876543210", "customer@example.com", "encoded-password");
        ReflectionTestUtils.setField(customer, "id", 41L);
    }

    @Test
    void customerLoginSavesAuthenticatedSessionContext() {
        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(passwordEncoder.matches("customer-password", "encoded-password")).thenReturn(true);
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        controller.login(
                new LoginRequest("customer@example.com", "customer-password"),
                request,
                response);

        ArgumentCaptor<SecurityContext> contextCaptor = ArgumentCaptor.forClass(SecurityContext.class);
        verify(securityContextRepository).saveContext(
                contextCaptor.capture(),
                same(request),
                same(response));
        Authentication authentication = contextCaptor.getValue().getAuthentication();
        assertEquals("customer@example.com", authentication.getName());
        assertEquals("ROLE_CUSTOMER", authentication.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void purchaseHistoryQueriesOnlyTheAuthenticatedCustomer() {
        Authentication authentication = org.springframework.security.authentication
                .UsernamePasswordAuthenticationToken.authenticated(
                        "customer@example.com",
                        null,
                        List.of(() -> "ROLE_CUSTOMER"));
        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(paymentNotificationRepository.findAllByUser_IdOrderByCompletedAtDesc(41L))
                .thenReturn(List.of());

        assertEquals(0, controller.purchaseHistory(authentication).size());
        verify(paymentNotificationRepository).findAllByUser_IdOrderByCompletedAtDesc(41L);
    }
}
