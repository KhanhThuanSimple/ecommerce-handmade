package com.handmade.handmade_api.modules.payment.controller;

import com.handmade.handmade_api.modules.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/client/checkout")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VNPayCheckoutController {

    private final OrderService orderService;

    // API 1: Khởi tạo URL Thanh toán an toàn từ Backend (Thay thế logic cũ ở FE)
    @PostMapping("/payment-url/{orderId}")
    public ResponseEntity<?> generatePaymentUrl(@PathVariable("orderId") String orderId, HttpServletRequest request) {
        // Giả lập tích hợp mã nhúng SDK VNPay trên Spring Boot của bạn
        // Sử dụng cấu trúc vnp_TxnRef = orderId
        String mockVNPayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=" + orderId;

        Map<String, String> response = new HashMap<>();
        response.put("paymentUrl", mockVNPayUrl);
        return ResponseEntity.ok(response);
    }

    // API 2: Nhận Callback đối soát từ trang VNPayCallback của React gửi qua
    @GetMapping("/vnpay-return")
    public ResponseEntity<?> handleVNPayReturn(@RequestParam Map<String, String> allParams) {
        try {
            orderService.handleVNPayCallback(allParams);
            Map<String, String> response = new HashMap<>();

            String responseCode = allParams.get("vnp_ResponseCode");
            if ("00".equals(responseCode)) {
                response.put("code", "00");
                response.put("message", "Thành công");
            } else {
                response.put("code", responseCode);
                response.put("message", "Giao dịch không thành công");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("code", "99");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}