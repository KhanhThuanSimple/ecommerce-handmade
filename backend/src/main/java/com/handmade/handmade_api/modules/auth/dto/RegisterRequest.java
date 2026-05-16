package com.handmade.handmade_api.modules.auth.dto;

public class RegisterRequest {
    private String email;
    private String password;
    private String username;
    private String fullName;
    private String phone;

    public RegisterRequest(String email, String password, String username, String fullName, String phone) {
        this.email = email;
        this.password = password;
        this.username = username;
        this.fullName = fullName;
        this.phone = phone;
    }

    public RegisterRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}
