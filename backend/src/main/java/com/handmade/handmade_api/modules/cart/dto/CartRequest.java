package com.handmade.handmade_api.modules.cart.dto;
import java.util.List;

public class CartRequest {
    private Long userId;
    private List<CartItemDto> items;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public List<CartItemDto> getItems() { return items; }
    public void setItems(List<CartItemDto> items) { this.items = items; }
}