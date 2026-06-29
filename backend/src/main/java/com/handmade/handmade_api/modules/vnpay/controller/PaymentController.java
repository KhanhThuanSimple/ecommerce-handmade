package com.handmade.handmade_api.modules.vnpay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.handmade.handmade_api.modules.vnpay.config.VNPayConfig;
import com.handmade.handmade_api.modules.vnpay.dto.PaymentRequestDto;
import com.handmade.handmade_api.modules.vnpay.factory.PaymentFactory;
import com.handmade.handmade_api.modules.vnpay.strategy.PaymentStrategy;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentFactory paymentFactory;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaymentController(PaymentFactory paymentFactory, JdbcTemplate jdbcTemplate) {
        this.paymentFactory = paymentFactory;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 1. API Khởi tạo link thanh toán (Giữ nguyên logic của bạn)
     */
    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequestDto request) {
        try {
            String sql = "SELECT is_active, config_json FROM payment_methods WHERE code = ?";
            Map<String, Object> methodData = jdbcTemplate.queryForMap(sql, request.getPaymentMethod().toUpperCase());

            Boolean isActive = (Boolean) methodData.get("is_active");
            String configJson = (String) methodData.get("config_json");

            if (isActive == null || !isActive) {
                return ResponseEntity.badRequest().body("Cổng thanh toán " + request.getPaymentMethod() + " đang bảo trì.");
            }

            PaymentStrategy strategy = paymentFactory.getStrategy(request.getPaymentMethod());
            String paymentUrl = strategy.createPaymentUrl(request.getOrderId(), request.getAmount(), configJson);

            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", paymentUrl);
            response.put("status", "PENDING");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi xử lý thanh toán: " + e.getMessage());
        }
    }

    /**
     * 2. API Lấy danh sách cổng thanh toán active kèm Logo (Giữ nguyên logic của bạn)
     */
    @GetMapping("/methods")
    public ResponseEntity<?> getActivePaymentMethods() {
        try {
            String sql = "SELECT code, name, is_active FROM payment_methods WHERE is_active = true ORDER BY code DESC";
            List<Map<String, Object>> methods = jdbcTemplate.queryForList(sql);

            List<Map<String, Object>> structuredMethods = new ArrayList<>();
            for (Map<String, Object> method : methods) {
                Map<String, Object> m = new HashMap<>(method);
                String code = (String) method.get("code");

                if ("VNPAY".equalsIgnoreCase(code)) {
                    m.put("logoUrl", "https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAY-QR-1.png");
                    m.put("description", "Thanh toán bằng ứng dụng ngân hàng, ví VNPAY, thẻ ATM hoặc thẻ quốc tế.");
                } else if ("COD".equalsIgnoreCase(code)) {
                    m.put("logoUrl", "https://cdn-icons-png.flaticon.com/512/6491/6491490.png");
                    m.put("description", "Thanh toán bằng tiền mặt trực tiếp khi nhận hàng tận nơi.");
                } else if ("MOMO".equalsIgnoreCase(code)) {
                    m.put("logoUrl", "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png");
                    m.put("description", "Thanh toán nhanh chóng qua ứng dụng ví điện tử MoMo.");
                } else {
                    m.put("logoUrl", "https://via.placeholder.com/40");
                    m.put("description", "Cổng liên kết thanh toán an toàn.");
                }
                structuredMethods.add(m);
            }
            return ResponseEntity.ok(structuredMethods);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Không thể tải cổng thanh toán: " + e.getMessage());
        }
    }

    /**
     * 3. SỬA ĐỔI HOÀN THIỆN: API Callback tiếp nhận kết quả phản hồi từ VNPay công khai
     * Tích hợp đồng thời: Xác thực bảo mật -> Trừ kho tồn kho -> Dọn dẹp giỏ hàng.
     */
    @GetMapping("/vnpay/return")
    @Transactional(rollbackFor = Exception.class) // Đảm bảo lỗi bất kỳ trong cụm xử lý sẽ Rollback toàn bộ dữ liệu sạch sẽ
    public ResponseEntity<?> vnpayCallback(@RequestParam Map<String, String> fields) {
        try {
            // Bước 3.1: Lấy HashSecret từ cấu hình DB để đối soát chữ ký
            String sqlConfig = "SELECT config_json FROM payment_methods WHERE code = 'VNPAY'";
            String configJson = jdbcTemplate.queryForObject(sqlConfig, String.class);

            Map<String, String> config = objectMapper.readValue(configJson, Map.class);
            String vnp_HashSecret = config.get("vnp_HashSecret");

            // Bước 3.2: Tách lấy SecureHash do VNPay ký gửi sang
            String vnp_SecureHash = fields.get("vnp_SecureHash");
            fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");

            // Bước 3.3: Sắp xếp tham số theo bảng chữ cái để tái dựng dữ liệu băm
            List<String> fieldNames = new ArrayList<>(fields.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = fields.get(fieldName);
                if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }

            // Bước 3.4: Kiểm tra tính toàn vẹn chữ ký (Chống bypass URL giả mạo thanh toán)
            String signValue = VNPayConfig.hmacSHA512(vnp_HashSecret, hashData.toString());
            if (!signValue.equalsIgnoreCase(vnp_SecureHash)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Chữ ký bảo mật không hợp lệ (Invalid Checksum)"));
            }

            // Bước 3.5: Đọc mã phản hồi giao dịch từ VNPay
            String responseCode = fields.get("vnp_ResponseCode"); // "00" có nghĩa là giao dịch thành công tại cổng VNPay
            String orderId = fields.get("vnp_TxnRef");
            String vnpayTranNo = fields.get("vnp_TransactionNo");

            // Kiểm tra trạng thái đơn hàng hiện tại tránh việc xử lý lặp lại nhiều lần (Tránh trừ kho 2 lần)
            String checkOrderSql = "SELECT status FROM orders WHERE id = ?";
            String currentStatus = jdbcTemplate.queryForObject(checkOrderSql, String.class, orderId);

            if (!"PENDING".equalsIgnoreCase(currentStatus) && !"Chờ thanh toán".equalsIgnoreCase(currentStatus)) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Đơn hàng đã được xử lý từ trước."));
            }

            if ("00".equals(responseCode)) {
                // A. Cập nhật trạng thái hóa đơn tổng thành COMPLETED và lưu mã giao dịch VNPay đối soát
                String updateOrderSql = "UPDATE orders SET status = 'COMPLETED', vnpay_tran_no = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
                int rows = jdbcTemplate.update(updateOrderSql, vnpayTranNo, orderId);

                if (rows > 0) {

                    // B. LUỒNG SỬA ĐỔI: TỰ ĐỘNG KHẤU TRỪ SẢN PHẨM TỒN KHO TRONG BIẾN THỂ (PRODUCT_VARIANTS)
                    String sqlGetOrderProducts = "SELECT product_id, quantity FROM order_items WHERE order_id = ?";
                    List<Map<String, Object>> items = jdbcTemplate.queryForList(sqlGetOrderProducts, orderId);

                    for (Map<String, Object> item : items) {
                        Long productId = ((Number) item.get("product_id")).longValue();
                        Integer quantity = (Integer) item.get("quantity");

                        // Thực hiện câu lệnh trừ kho, đi kèm điều kiện inventory >= số lượng mua nhằm tránh lỗi số âm kho
                        String updateStockSql = "UPDATE product_variants SET inventory = inventory - ? WHERE product_id = ? AND inventory >= ?";
                        int stockRows = jdbcTemplate.update(updateStockSql, quantity, productId, quantity);

                        if (stockRows == 0) {
                            // Bắn lỗi ra để chuỗi @Transactional kích hoạt Rollback, hủy bỏ trạng thái COMPLETED của đơn hàng
                            throw new RuntimeException("Sản phẩm mã định danh " + productId + " đã hết hoặc không đủ số lượng tồn kho!");
                        }
                    }

                    // C. LUỒNG TỐI ƯU HÓA: DỌN SẠCH CÁC SẢN PHẨM ĐÃ MUA KHỎI GIỎ HÀNG (CART_ITEMS)
                    try {
                        String sqlGetOrderInfo = "SELECT user_id FROM orders WHERE id = ?";
                        Long userId = jdbcTemplate.queryForObject(sqlGetOrderInfo, Long.class, orderId);

                        if (userId != null && !items.isEmpty()) {
                            String sqlGetCartId = "SELECT id FROM carts WHERE user_id = ?";
                            Long cartId = jdbcTemplate.queryForObject(sqlGetCartId, Long.class, userId);

                            if (cartId != null) {
                                String sqlDeleteCartItems = "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?";
                                for (Map<String, Object> item : items) {
                                    Long pid = ((Number) item.get("product_id")).longValue();
                                    jdbcTemplate.update(sqlDeleteCartItems, cartId, pid);
                                }
                            }
                        }
                    } catch (Exception cartEx) {
                        // In lỗi ra bảng log, không throw Exception tại đây tránh việc làm hỏng luồng cập nhật tiền của người dùng
                        System.err.println("Cảnh báo dọn dẹp giỏ hàng thất bại: " + cartEx.getMessage());
                    }

                    return ResponseEntity.ok(Map.of("success", true, "message", "Thanh toán thành công và khấu trừ kho hoàn tất!", "orderId", orderId));
                } else {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy mã đơn hàng hợp lệ trong cơ sở dữ liệu."));
                }
            } else {
                // Thanh toán thất bại hoặc người dùng tự động bấm nút hủy bỏ tại trang VNPay
                String updateFailedSql = "UPDATE orders SET status = 'FAILED', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
                jdbcTemplate.update(updateFailedSql, orderId);
                return ResponseEntity.ok(Map.of("success", false, "message", "Giao dịch đã bị hủy hoặc gặp lỗi từ cổng thanh toán.", "code", responseCode));
            }

        } catch (Exception e) {
            // Khi xảy ra lỗi trừ kho, hệ thống tự động trả lại toàn bộ trạng thái đơn hàng ban đầu
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Lỗi nghiêm trọng trong quá trình xử lý Callback: " + e.getMessage()));
        }
    }
}