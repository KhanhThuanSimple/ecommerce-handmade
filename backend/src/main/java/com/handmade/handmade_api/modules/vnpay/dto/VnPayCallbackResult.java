package com.handmade.handmade_api.modules.vnpay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VnPayCallbackResult {
    private boolean success;
    private boolean signatureValid;
    private String orderId;
    private String responseCode;
    private String transactionNo;
    private String message;
}
