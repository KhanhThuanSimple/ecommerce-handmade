package com.handmade.handmade_api.modules.adminProduct.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminVariantInventoryUpdateRequest {
    private Long variantId; // Nếu truyền null sẽ mặc định cập nhật biến thể đầu tiên
    private Integer inventory;
}