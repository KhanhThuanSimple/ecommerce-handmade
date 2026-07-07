package com.handmade.handmade_api.modules.reviews.dto;

public class ReviewRequest {
    private Long productId;
    private Long userId;
    private Long orderItemId;   // ID của order_item cụ thể (cho phép review theo từng đơn)
    private String orderId;     // ID đơn hàng
    private Integer rating;
    private String comment;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Long orderItemId) { this.orderItemId = orderItemId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
