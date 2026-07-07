package com.handmade.handmade_api.modules.reviews.dto;

/**
 * Một review user ĐÃ gửi, kèm thông tin sản phẩm và đơn hàng.
 */
public class CompletedReviewItemDTO {
    private Long reviewId;
    private Long orderItemId;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private String orderId;
    private Integer rating;
    private String comment;
    private String reviewDate;  // ISO string

    public CompletedReviewItemDTO() {}

    public Long getReviewId() { return reviewId; }
    public void setReviewId(Long reviewId) { this.reviewId = reviewId; }

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

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getReviewDate() { return reviewDate; }
    public void setReviewDate(String reviewDate) { this.reviewDate = reviewDate; }
}
