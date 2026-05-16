package com.handmade.handmade_api.modules.products.dto;

import lombok.*;

@Getter
@Setter

public class ProductCreateRequest {
    private String name;
    private Double price;       // Hứng trường 'price' của FE
    private String category;    // Hứng tên danh mục chữ
    private Long categoryId;    // Hứng ID số
    private String description;
    private Integer inventory;
    private String status;      // Nhận chuỗi 'active' | 'inactive' | 'lowstock'

    public ProductCreateRequest() {
    }

    public ProductCreateRequest(String name, Double price, String category, Long categoryId, String description, Integer inventory, String status) {
        this.name = name;
        this.price = price;
        this.category = category;
        this.categoryId = categoryId;
        this.description = description;
        this.inventory = inventory;
        this.status = status;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getInventory() {
        return inventory;
    }

    public void setInventory(Integer inventory) {
        this.inventory = inventory;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}