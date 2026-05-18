package com.handmade.handmade_api.modules.cart.entity;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL) // Chỉ lưu những trường có dữ liệu xuống DB
public class CartItem {
    private Long id;
    private Long productId;
    private Integer quantity;
    
    // Các trường này chỉ dùng để nạp dữ liệu trả về cho Frontend hiển thị, không lưu xuống DB users
    private String productName;
    private Double price;
    private String imageUrl;

    // ==========================================
    // GETTERS VÀ SETTERS
    // ==========================================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}