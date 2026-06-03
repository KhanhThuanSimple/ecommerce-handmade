package com.handmade.handmade_api.modules.adminorder.DTO;


import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminOrderFilterRequest {
    private String orderId;
    private Long userId;
    private String userEmail;
    private String phone;
    private String orderStatus;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
    private Double minAmount;
    private Double maxAmount;
    private String sortBy; // createdAt, totalAmount, payableAmount
    private String sortDirection; // ASC, DESC
    private Integer page;
    private Integer size;
}
