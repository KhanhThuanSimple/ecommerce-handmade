package com.handmade.handmade_api.modules.vnpay.dto;

import lombok.Data;

@Data
public class VnPayCreateRequest {
    private String orderId;
    private Double amount;
}
