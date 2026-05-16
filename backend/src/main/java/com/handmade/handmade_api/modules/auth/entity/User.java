package com.handmade.handmade_api.modules.auth.entity;


import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
@Getter // Tạo getEmail(), getFullName()...
@Setter // Tạo setEmail(), setFullName()...
@NoArgsConstructor // Tạo constructor User() không tham số
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name")
    private String fullName;

    private String phone;

    private boolean enabled = true;
    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    // Tự động gán ngày giờ trước khi lưu vào DB
    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    // Tự động cập nhật ngày giờ khi update dữ liệu
    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
    @Override
    public String getUsername() {
        return this.email; // Bắt buộc trả về email nếu bạn dùng email để đăng nhập
    }
    @Override
    public String getPassword() {
        return this.password;
    }
    // Quan hệ với bảng authorities bằng cách sử dụng ElementCollection cho đơn giản
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "authorities", joinColumns = @JoinColumn(name = "username", referencedColumnName = "username"))
    @Column(name = "authority")
    private Set<String> roles;

    // --- CÁC PHƯƠNG THỨC BẮT BUỘC CỦA USERDETAILS ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (roles == null) return Collections.emptyList();
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return this.enabled; }
}