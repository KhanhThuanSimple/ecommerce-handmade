package com.handmade.handmade_api.modules.adminPayment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/payment/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')") // 👈 Ngăn chặn hacker gửi API đổi ví nhận tiền VNPay
public class AdminPaymentController {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AdminPaymentController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/methods")
    public ResponseEntity<?> getAllMethodsForAdmin() {
        try {
            String sql = "SELECT code, name, is_active, updated_at FROM payment_methods ORDER BY code DESC";
            List<Map<String, Object>> methods = jdbcTemplate.queryForList(sql);

            for (Map<String, Object> m : methods) {
                String code = (String) m.get("code");
                if ("VNPAY".equalsIgnoreCase(code)) {
                    m.put("logoUrl", "https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAY-QR-1.png");
                } else if ("COD".equalsIgnoreCase(code)) {
                    m.put("logoUrl", "https://cdn-icons-png.flaticon.com/512/6491/6491490.png");
                }
            }
            return ResponseEntity.ok(methods);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi lấy danh sách cấu hình: " + e.getMessage());
        }
    }

    @GetMapping("/methods/{code}")
    public ResponseEntity<?> getMethodDetail(@PathVariable String code) {
        try {
            String sql = "SELECT code, name, is_active, config_json FROM payment_methods WHERE code = ?";
            Map<String, Object> method = jdbcTemplate.queryForMap(sql, code.toUpperCase());

            String configJson = (String) method.get("config_json");
            Map<?, ?> configMap = objectMapper.readValue(configJson, Map.class);

            Map<String, Object> response = new HashMap<>(method);
            response.put("config_fields", configMap);
            response.remove("config_json");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Không tìm thấy cấu hình cổng: " + code);
        }
    }

    @PutMapping("/methods/{code}")
    @Transactional
    public ResponseEntity<?> updateMethodConfig(@PathVariable String code, @RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.get("name");

            // ✅ Đã sửa: Ép kiểu an toàn chống bẫy ClassCastException từ Map Jackson
            Object activeObj = payload.get("isActive");
            Boolean isActive = activeObj instanceof Boolean ? (Boolean) activeObj : Boolean.parseBoolean(String.valueOf(activeObj));

            Map<?, ?> configData = (Map<?, ?>) payload.get("configData");
            String configJsonString = objectMapper.writeValueAsString(configData);

            String sql = "UPDATE payment_methods SET name = ?, is_active = ?, config_json = ?, updated_at = CURRENT_TIMESTAMP WHERE code = ?";
            jdbcTemplate.update(sql, name, isActive, configJsonString, code.toUpperCase());

            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật cổng " + code + " thành công!"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi cập nhật cấu hình: " + e.getMessage());
        }
    }
}