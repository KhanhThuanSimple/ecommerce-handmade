package com.handmade.handmade_api.modules.products.dto;

public interface ProductProjection {
    Long getId();
    String getName();
    Double getPrice();
    String getCategoryName();
    Long getCategoryId();
    String getImageUrl();
    String getDescription();
    Integer getTotalInventory();
    Double getRating();
    Integer getCommentCount();
    Integer getViewCount();
    String getStatus();
    Integer getSoldCount();
}