package com.handmade.handmade_api.modules.reviews.dto;
import java.time.LocalDateTime;
public class ReviewResponse {
private Long id;
    private Long userId;
    private String userName; // FE dùng r.userName để kiểm tra
    private Long productId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    // Constructors, Getters, Setters
    public ReviewResponse() {}

    public ReviewResponse(Long id, Long userId, String userName, Long productId, Integer rating, String comment, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.productId = productId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    // ... Getters và Setters tương ứng
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}