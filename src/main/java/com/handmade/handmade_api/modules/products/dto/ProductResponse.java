package com.handmade.handmade_api.modules.products.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // 🌟 Bắt buộc phải có để JPQL map đúng thứ tự nhận vào
@Builder
public class ProductResponse {
    private Long id;            // 1
    private String name;        // 2
    private Double price;       // 3
    private String category;    // 4
    private Long categoryId;    // 5
    private String imageUrl;    // 6
    private String description; // 7
    private Integer inventory;  // 8 -> Hứng dữ liệu tổng SUM(pv.inventory) từ DB gửi lên
    private Double rating;      // 9
    private Integer commentCount;// 10
    private Integer viewCount;  // 11
    private String status;      // 12
    private Integer soldCount;  // 13
}