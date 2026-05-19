package com.handmade.handmade_api.modules.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartItemUpdateRequest {
    @NotNull(message = "ID sản phẩm không được trống")
    private Long productId;

    @NotNull(message = "Số lượng không được trống")
    @Min(value = 0, message = "Số lượng phải lớn hơn hoặc bằng 0")
    private Integer quantity;
}
