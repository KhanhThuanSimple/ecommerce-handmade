package com.handmade.handmade_api.modules.luckywheel.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lucky_prizes") // 💡 ÉP KHỚP CHÍNH XÁC VỚI BẢNG TRONG SQL CỦA BẠN
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prize {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String type; // Lưu 'discount', 'voucher', 'points' theo SQL seed data của bạn

    private Integer value;

    @Column(length = 50)
    private String icon;

    @Column(length = 20)
    private String color;

    @Column(name = "text_color", length = 20) // Khớp snake_case text_color trong DB
    private String textColor;

    @Column(columnDefinition = "TEXT")
    private String description;
}