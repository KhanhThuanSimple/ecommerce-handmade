package com.handmade.handmade_api.modules.auth.dto;

import java.util.Collection;
import java.util.List;

public class AuthResponse {
    private Long id;
    private String email;
    private String fullName;
    private List<String> roles; // Chuyển từ String role sang List<String> roles

    public AuthResponse(Long id, String email, String fullName, List<String> roles) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
    }

    public AuthResponse() {}

    // Getters và Setters cho roles
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    // Các Getters/Setters khác giữ nguyên...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}