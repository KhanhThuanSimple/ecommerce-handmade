package com.handmade.handmade_api.modules.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "roles")
@Getter
@Setter
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name; // Sẽ lưu dạng: "ROLE_ADMIN", "ROLE_USER"

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(length = 10)
    private String color;
}