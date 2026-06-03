package com.handmade.handmade_api.modules.chatbox.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_sessions")
@Data
public class ChatSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    // Thêm field đánh dấu anonymous
    @Column(name = "is_anonymous")
    private Boolean isAnonymous = false;

    // Thêm anonymous_id để tracking
    @Column(name = "anonymous_id", length = 100)
    private String anonymousId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}