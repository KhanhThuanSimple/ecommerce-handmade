package com.handmade.handmade_api.modules.cart.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartAddRequest {
    @NotNull(message = "ID người dùng không được trống")
    private Long userId;

    @NotNull(message = "ID sản phẩm không được trống")
    private Long productId;

    @NotNull(message = "Số lượng không được trống")
    private Integer quantity;
}