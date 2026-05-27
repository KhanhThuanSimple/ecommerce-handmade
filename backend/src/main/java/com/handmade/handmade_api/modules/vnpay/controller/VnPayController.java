package com.handmade.handmade_api.modules.vnpay.controller;

import com.handmade.handmade_api.modules.orders.dto.OrderResponse;
import com.handmade.handmade_api.modules.orders.service.OrderService;
import com.handmade.handmade_api.modules.vnpay.dto.VnPayCallbackResult;
import com.handmade.handmade_api.modules.vnpay.dto.VnPayCreateRequest;
import com.handmade.handmade_api.modules.vnpay.dto.VnPayCreateResponse;
import com.handmade.handmade_api.modules.vnpay.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vnpay")
public class VnPayController {

    private final VnPayService vnPayService;
    private final OrderService orderService;

    public VnPayController(VnPayService vnPayService, OrderService orderService) {
        this.vnPayService = vnPayService;
        this.orderService = orderService;
    }

    /** Tạo URL thanh toán VNPay (có chữ ký HMAC SHA512) */
    @PostMapping("/create-url")
    public ResponseEntity<VnPayCreateResponse> createPaymentUrl(
            @RequestBody VnPayCreateRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = httpRequest.getRemoteAddr();
        String paymentUrl = vnPayService.createPaymentUrl(
                request.getOrderId(),
                request.getAmount(),
                clientIp
        );
        return ResponseEntity.ok(new VnPayCreateResponse(paymentUrl));
    }

    /**
     * Xác thực kết quả khi user quay về từ VNPay (Return URL).
     * FE gọi endpoint này với toàn bộ query string VNPay trả về.
     */
    @GetMapping("/return")
    public ResponseEntity<VnPayCallbackResult> handleReturn(HttpServletRequest request) {
        Map<String, String> params = extractRequestParams(request);
        VnPayCallbackResult result = vnPayService.processCallback(params);
        applyOrderUpdate(result);
        return ResponseEntity.ok(result);
    }

    /**
     * IPN: VNPay gọi server-to-server (cấu hình URL này trên portal VNPay).
     */
    @GetMapping(value = "/ipn", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleIpn(HttpServletRequest request) {
        Map<String, String> params = extractRequestParams(request);
        VnPayCallbackResult result = vnPayService.processCallback(params);

        if (!result.isSignatureValid()) {
            return ResponseEntity.ok("RspCode=97&Message=Invalid Checksum");
        }

        try {
            applyOrderUpdate(result);
            if (result.isSuccess()) {
                return ResponseEntity.ok("RspCode=00&Message=Confirm Success");
            }
            return ResponseEntity.ok("RspCode=00&Message=Confirm Success");
        } catch (Exception ex) {
            return ResponseEntity.ok("RspCode=99&Message=Unknown error");
        }
    }

    private void applyOrderUpdate(VnPayCallbackResult result) {
        if (!result.isSignatureValid() || result.getOrderId() == null) {
            return;
        }

        Map<String, Object> updates = new HashMap<>();
        if (result.isSuccess()) {
            updates.put("status", "Đã thanh toán");
            if (result.getTransactionNo() != null) {
                updates.put("vnpayTranNo", result.getTransactionNo());
            }
        } else {
            updates.put("status", "Thanh toán thất bại");
        }

        OrderResponse updated = orderService.patchOrder(result.getOrderId(), updates);
        result.setMessage(updated.getStatus());
    }

    private Map<String, String> extractRequestParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return params;
    }
}
