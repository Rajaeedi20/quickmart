package com.quickmart.user.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_users_email",
            columnNames = "email"
        )
    }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 10)
    private String mobile;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "password", nullable = false)
    private String legacyPassword;

    @Column(name = "registered_at", updatable = false)
    private LocalDateTime registeredAt;

    public User() {
    }

    public User(String name, String mobile, String email, String passwordHash) {
        this.name = name;
        this.fullName = name;
        this.mobile = mobile;
        this.email = email;
        this.passwordHash = passwordHash;
        this.legacyPassword = passwordHash;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
        this.fullName = name;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getEmail() {
        return email;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
        this.legacyPassword = passwordHash;
    }

    @PrePersist
    protected void setRegistrationDate() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }
}