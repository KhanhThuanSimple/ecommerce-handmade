package com.handmade.handmade_api.modules.cart.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CartMergeRequest {
    @NotNull(message = "ID người dùng không được trống")
    private Long userId;

    private List<ItemMerge> items;

    @Data
    public static class ItemMerge {
        private Long productId;
        private Integer quantity;
    }
}