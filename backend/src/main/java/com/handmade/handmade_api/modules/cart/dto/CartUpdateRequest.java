package com.handmade.handmade_api.modules.cart.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CartUpdateRequest {
    @NotNull(message = "Danh sách sản phẩm không được trống")
    @Size(min = 0, message = "Danh sách sản phẩm không được trống")
    @Valid
    private List<CartItemUpdateRequest> items;
}
