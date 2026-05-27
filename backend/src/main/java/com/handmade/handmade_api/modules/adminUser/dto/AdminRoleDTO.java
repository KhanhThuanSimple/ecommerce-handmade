package com.handmade.handmade_api.modules.adminUser.dto;

import com.handmade.handmade_api.modules.auth.entity.Role;

public class AdminRoleDTO {
    private Long id;
    private String name;
    private String displayName;
    private String color;

    // 1. CONSTRUCTOR RỖNG: Bắt buộc phải có để Jackson giải mã JSON thành công
    public AdminRoleDTO() {
    }

    // 2. Constructoxr dùng để map dữ liệu từ Entity sang DTO (Dùng cho API GET)
    public AdminRoleDTO(Role role) {
        this.id = role.getId();
        this.name = role.getName();
        this.displayName = role.getDisplayName();
        this.color = role.getColor();
    }

    // Getters và Setters đầy đủ
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}