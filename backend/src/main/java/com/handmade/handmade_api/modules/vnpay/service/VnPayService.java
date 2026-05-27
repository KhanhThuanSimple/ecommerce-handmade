package com.handmade.handmade_api.modules.vnpay.service;

import com.handmade.handmade_api.modules.orders.entity.Order;
import com.handmade.handmade_api.modules.orders.repository.OrderRepository;
import com.handmade.handmade_api.modules.vnpay.config.VnPayProperties;
import com.handmade.handmade_api.modules.vnpay.dto.VnPayCallbackResult;
import com.handmade.handmade_api.modules.vnpay.util.VnPayUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

@Service
public class VnPayService {

    private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VnPayProperties properties;
    private final OrderRepository orderRepository;

    public VnPayService(VnPayProperties properties, OrderRepository orderRepository) {
        this.properties = properties;
        this.orderRepository = orderRepository;
    }

    public boolean isVnPayPayment(String paymentMethod) {
        if (paymentMethod == null) {
            return false;
        }
        String normalized = paymentMethod.trim().toUpperCase();
        return normalized.equals("VNPAY") || normalized.contains("VNPAY") || normalized.contains("VN PAY");
    }

    public String normalizePaymentMethod(String paymentMethod) {
        if (paymentMethod == null) {
            return null;
        }
        if (isVnPayPayment(paymentMethod)) {
            return "VNPAY";
        }
        return paymentMethod.trim().toUpperCase();
    }

    public boolean isPaymentSuccess(String responseCode) {
        return responseCode != null && responseCode.trim().equals("00");
    }

    /**
     * Tạo URL chuyển sang cổng VNPay sandbox/production (đúng chuẩn HMAC SHA512).
     */
    public String createPaymentUrl(String orderId, Double amountVnd, String clientIp) {
        if (orderId == null || orderId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId không hợp lệ");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng: " + orderId));

        if (!isVnPayPayment(order.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn hàng không dùng phương thức VNPay");
        }

        long payableVnd = Math.round(order.getPayableAmount() == null ? 0 : order.getPayableAmount());
        if (amountVnd != null) {
            long requested = Math.round(amountVnd);
            if (requested != payableVnd) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Số tiền thanh toán không khớp đơn hàng. Mong đợi: " + payableVnd);
            }
        }

        if (payableVnd <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền thanh toán phải lớn hơn 0");
        }

        String ip = (clientIp == null || clientIp.isBlank()) ? "127.0.0.1" : clientIp;
        if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        if (ip.length() > 45) {
            ip = ip.substring(0, 45);
        }

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", properties.getVersion());
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", properties.getTmnCode());
        params.put("vnp_Amount", String.valueOf(payableVnd * 100L));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", orderId);
        params.put("vnp_OrderInfo", "Thanh toan don hang " + orderId);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", properties.getReturnUrl());
        params.put("vnp_IpAddr", ip);
        params.put("vnp_CreateDate", LocalDateTime.now().format(VNPAY_DATE_FORMAT));

        String hashData = VnPayUtil.buildHashData(params);
        String secureHash = VnPayUtil.hmacSha512(properties.getHashSecret(), hashData);

        return VnPayUtil.buildPaymentUrl(properties.getPayUrl(), params, secureHash);
    }

    public VnPayCallbackResult processCallback(Map<String, String> rawParams) {
        Map<String, String> vnpParams = extractVnpParams(rawParams);
        String receivedHash = rawParams.get("vnp_SecureHash");

        if (!VnPayUtil.verifySecureHash(vnpParams, receivedHash, properties.getHashSecret())) {
            return VnPayCallbackResult.builder()
                    .success(false)
                    .signatureValid(false)
                    .message("Chữ ký VNPay không hợp lệ")
                    .build();
        }

        String responseCode = vnpParams.get("vnp_ResponseCode");
        String orderId = vnpParams.get("vnp_TxnRef");
        String transactionNo = vnpParams.get("vnp_TransactionNo");
        String amountStr = vnpParams.get("vnp_Amount");

        boolean paymentSuccess = isPaymentSuccess(responseCode);

        if (paymentSuccess && orderId != null) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && amountStr != null) {
                long paidAmount = Long.parseLong(amountStr);
                long expected = Math.round((order.getPayableAmount() == null ? 0 : order.getPayableAmount()) * 100L);
                if (paidAmount != expected) {
                    return VnPayCallbackResult.builder()
                            .success(false)
                            .signatureValid(true)
                            .orderId(orderId)
                            .responseCode(responseCode)
                            .transactionNo(transactionNo)
                            .message("Số tiền VNPay không khớp đơn hàng")
                            .build();
                }
            }
        }

        return VnPayCallbackResult.builder()
                .success(paymentSuccess)
                .signatureValid(true)
                .orderId(orderId)
                .responseCode(responseCode)
                .transactionNo(transactionNo)
                .message(paymentSuccess ? "Thanh toán thành công" : "Thanh toán thất bại hoặc đã hủy")
                .build();
    }

    private Map<String, String> extractVnpParams(Map<String, String> rawParams) {
        Map<String, String> vnpParams = new HashMap<>();
        rawParams.forEach((key, value) -> {
            if (key == null || !key.startsWith("vnp_")) {
                return;
            }
            if ("vnp_SecureHash".equals(key) || "vnp_SecureHashType".equals(key)) {
                return;
            }
            if (value != null && !value.isEmpty()) {
                vnpParams.put(key, value);
            }
        });
        return vnpParams;
    }
}
