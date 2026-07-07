package com.handmade.handmade_api.modules.reviews.dto;

/**
 * Một order_item từ đơn đã hoàn thành mà user CHƯA đánh giá.
 * Mỗi (orderItemId) là unique — cho phép user đánh giá
 * cùng 1 sản phẩm nhiều lần nếu mua nhiều đơn khác nhau.
 */
public class PendingReviewItemDTO {
    private Long orderItemId;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private String orderId;
    private String orderDate;   // ISO string
    private Double price;
    private Integer quantity;

    public PendingReviewItemDTO() {}

    public Long getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Long orderItemId) { this.orderItemId = orderItemId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductImageUrl() { return productImageUrl; }
    public void setProductImageUrl(String productImageUrl) { this.productImageUrl = productImageUrl; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getOrderDate() { return orderDate; }
    public void setOrderDate(String orderDate) { this.orderDate = orderDate; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
