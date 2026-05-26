package com.handmade.handmade_api.modules.admin.adminUser.dto;

import com.handmade.handmade_api.modules.auth.entity.User;
import java.util.List;
import java.util.stream.Collectors;

public class AdminUserDashboardDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private boolean enabled;
    private boolean accountNonLocked;
    private List<String> roles;

    public AdminUserDashboardDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.enabled = user.isEnabled();
        this.accountNonLocked = user.isAccountNonLocked();
        // Trích xuất chuỗi tên quyền để Jackson không bị lặp vô hạn
        this.roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public boolean isEnabled() { return enabled; }
    public boolean isAccountNonLocked() { return accountNonLocked; }
    public List<String> getRoles() { return roles; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public void setAccountNonLocked(boolean accountNonLocked) { this.accountNonLocked = accountNonLocked; }
    public void setRoles(List<String> roles) { this.roles = roles; }
}