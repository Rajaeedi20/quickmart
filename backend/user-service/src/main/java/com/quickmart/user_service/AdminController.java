package com.quickmart.user.controller;

import java.util.List;
import java.util.Locale;

import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.quickmart.user.dto.AdminCustomerResponse;
import com.quickmart.user.dto.AdminLoginResponse;
import com.quickmart.user.dto.AdminPaymentReportResponse;
import com.quickmart.user.dto.LoginRequest;
import com.quickmart.user.repository.PaymentNotificationRepository;
import com.quickmart.user.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final UserRepository userRepository;
    private final PaymentNotificationRepository paymentNotificationRepository;

    public AdminController(
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            UserRepository userRepository,
            PaymentNotificationRepository paymentNotificationRepository) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.userRepository = userRepository;
        this.paymentNotificationRepository = paymentNotificationRepository;
    }

    @PostMapping("/login")
    public AdminLoginResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            email,
                            request.password()));

            if (servletRequest.getSession(false) != null) {
                servletRequest.changeSessionId();
            }

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, servletRequest, servletResponse);

            return new AdminLoginResponse(
                    "Admin login successful",
                    "QuickMart Admin",
                    authentication.getName(),
                    "ADMIN");
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid admin email or password");
        }
    }

    @GetMapping("/customers")
    public List<AdminCustomerResponse> customers() {
        return userRepository.findAllByOrderByIdDesc()
                .stream()
                .map(user -> new AdminCustomerResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getMobile(),
                        user.getRegisteredAt()))
                .toList();
    }

    @GetMapping("/payment-reports")
    @Transactional(readOnly = true)
    public List<AdminPaymentReportResponse> paymentReports() {
        return paymentNotificationRepository.findAllByOrderByCompletedAtDesc()
                .stream()
                .map(notification -> new AdminPaymentReportResponse(
                        notification.getPaymentId(),
                        notification.getOrderId(),
                        notification.getOrderNumber(),
                        notification.getUserId(),
                        notification.getCustomerName(),
                        notification.getCustomerEmail(),
                        notification.getReference(),
                        notification.getTotal(),
                        notification.getStatus(),
                        notification.getCompletedAt(),
                        notification.getItemsSummary()))
                .toList();
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }
}
