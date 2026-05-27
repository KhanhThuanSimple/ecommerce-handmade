package com.handmade.handmade_api.modules.vnpay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VnPayCreateResponse {
    private String paymentUrl;
}
