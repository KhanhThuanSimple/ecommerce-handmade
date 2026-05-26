package com.handmade.handmade_api.modules.orders.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class OrderItemRequest {
    private ProductInfo product;
    private Integer quantity;

    // Tự động hứng trường nếu FE ở trang Giỏ hàng truyền lên dạng phẳng "productId" hoặc "id"
    @JsonAlias({"productId", "id"})
    private Long productId;

    @Data
    public static class ProductInfo {
        private Long id;
        private String name;
        private Double price;
        private String imageUrl;
    }

    /**
     * Hàm lấy ID sản phẩm an toàn tuyệt đối cho dù FE truyền kiểu gì lên
     */
    public Long getSafeProductId() {
        if (this.product != null && this.product.getId() != null) {
            return this.product.getId();
        }
        return this.productId; // Trả về productId phẳng nếu object product bị null
    }
}