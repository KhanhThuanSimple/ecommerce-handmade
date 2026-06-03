package com.handmade.handmade_api.modules.adminorder.DTO;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderUpdateRequest {
    private String orderStatus;
    private String shippingStatus;
    private String paymentStatus;
    private String note;
    private String trackingNumber;
    private String shippingCarrier;
}