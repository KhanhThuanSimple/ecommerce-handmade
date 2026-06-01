package com.handmade.handmade_api.modules.vnpay.factory;

import com.handmade.handmade_api.modules.vnpay.strategy.PaymentStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PaymentFactory {

    // Spring tự động đưa "VNPAY" (Component name) thành key, và VNPayPaymentStrategy thành value trong Map này.
    private final Map<String, PaymentStrategy> strategies;

    public PaymentStrategy getStrategy(String paymentMethod) {
        PaymentStrategy strategy = strategies.get(paymentMethod.toUpperCase());
        if (strategy == null) {
            throw new IllegalArgumentException("Hệ thống chưa tích hợp cổng thanh toán: " + paymentMethod);
        }
        return strategy;
    }
}