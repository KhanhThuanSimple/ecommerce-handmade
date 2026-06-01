package com.handmade.handmade_api.modules.vnpay.strategy;

import java.math.BigDecimal;

public interface PaymentStrategy {
    String createPaymentUrl(String orderId, BigDecimal amount, String configJson);
}