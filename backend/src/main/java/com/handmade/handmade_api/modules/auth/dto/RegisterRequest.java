package com.handmade.handmade_api.modules.auth.dto;

import java.util.List;

public class RegisterRequest {
    private String email;
    private String password;
    private String username;
    private String fullName;
    private String phone;

    // BỔ SUNG: Biến hứng danh sách quyền từ Admin gửi lên
    private List<String> roles;

    public RegisterRequest() {
    }

    public RegisterRequest(String email, String password, String username, String fullName, String phone) {
        this.email = email;
        this.password = password;
        this.username = username;
        this.fullName = fullName;
        this.phone = phone;
    }

    // BỔ SUNG: Constructor đầy đủ tham số bao gồm cả roles nếu cần dùng sau này
    public RegisterRequest(String email, String password, String username, String fullName, String phone, List<String> roles) {
        this.email = email;
        this.password = password;
        this.username = username;
        this.fullName = fullName;
        this.phone = phone;
        this.roles = roles;
    }

    // CÁC HÀM GETTER VÀ SETTER CHO ROLES (ĐỂ HẾT LỖI GETROLES)
    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    // Các Getters và Setters cũ giữ nguyên vẹn
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}