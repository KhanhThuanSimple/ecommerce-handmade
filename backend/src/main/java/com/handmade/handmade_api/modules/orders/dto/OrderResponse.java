package com.handmade.handmade_api.modules.orders.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OrderResponse {
    private String id;
    private Long userId;
    private String fullName;
    private String customerEmail;
    private String phone;
    private String address;
    private List<OrderItemResponse> items;
    private Double totalAmount;
    private Double discountAmount;
    private Double payableAmount;
    private String voucherCode;
    private String paymentMethod;
    private String status;
    private String date;

    @Data
    @Builder
    public static class OrderItemResponse {
        private Long productId;
        private String productName;
        private Double productPrice;
        private String productImageUrl;
        private Integer quantity;
    }
}