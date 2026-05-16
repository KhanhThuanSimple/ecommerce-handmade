package com.handmade.handmade_api.modules.products.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // Đổi tên biến về 'price' để khớp với FE
    @Column(name = "base_price")
    private Double price;


    @Column(name = "category_id")
    private Long categoryId;

    private String slug;

    private String description;


    // Chuyển kiểu dữ liệu sang String để nhận 'active', 'inactive', 'lowstock'
    @Column(name = "status")
    private String status;

    @Column(name = "sold_count")
    private Integer soldCount = 0;
}