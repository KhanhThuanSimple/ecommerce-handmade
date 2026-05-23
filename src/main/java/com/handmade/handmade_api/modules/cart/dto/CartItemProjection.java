package com.handmade.handmade_api.modules.cart.dto;

public interface CartItemProjection {
    Long getProductId();
    String getProductName();
    Double getPrice();
    String getImageUrl();
    Integer getQuantity();
    Integer getMaxInventory(); // Tổng tồn kho biến thể dùng để chặn nút tăng số lượng ở UI
}