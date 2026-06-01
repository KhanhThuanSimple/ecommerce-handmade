package com.handmade.handmade_api.modules.auth.dto;

import com.handmade.handmade_api.modules.products.dto.ProductResponse;

import java.util.ArrayList;
import java.util.List;

public class AuthResponse {
    private Long id;
    private String email;
    private String username;
    private String fullName;
    private List<String> roles;
    private List<ProductResponse> wishlist = new ArrayList<>();
    private Integer points;
    private String lastSpinDate;

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

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public List<ProductResponse> getWishlist() { return wishlist; }
    public void setWishlist(List<ProductResponse> wishlist) { this.wishlist = wishlist; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public String getLastSpinDate() { return lastSpinDate; }
    public void setLastSpinDate(String lastSpinDate) { this.lastSpinDate = lastSpinDate; }
}