package com.handmade.handmade_api.modules.admin.adminProduct.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminVariantInventoryUpdateRequest {
    private Long variantId; // Nếu truyền null sẽ mặc đaaịnh cập nhật biến thể đầu tiên
    private Integer inventory;
}