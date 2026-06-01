package com.handmade.handmade_api.modules.vnpay.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequestDto {
    private String orderId;
    private BigDecimal amount;
    private String paymentMethod;

    // Getters and Setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }}