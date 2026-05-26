package com.handmade.handmade_api.modules.orders.dto;

import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    private String id;
    private Long userId;
    private String fullName;
    private String phone;
    private String address;
    private List<OrderItemRequest> items;
    private Double totalAmount;
    private Double discountAmount;
    private Double payableAmount;
    private String voucherCode;
    private String paymentMethod;
    private String status;
    private String date;
}
