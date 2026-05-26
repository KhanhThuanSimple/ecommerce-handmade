package com.handmade.handmade_api.modules.admin.adminProduct.dto;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductUpdateRequest {
    private String name;
    private Double price;
    private Long categoryId;
    private String description;
    private String status; // 'active' | aa'inactive' | 'lowstock'
}