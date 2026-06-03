package com.handmade.handmade_api.modules.adminchatbox.controller;

import com.handmade.handmade_api.modules.adminchatbox.DTO.ChatConfigDTO;
import com.handmade.handmade_api.modules.adminchatbox.entity.AiConfiguration;
import com.handmade.handmade_api.modules.adminchatbox.service.AdminChatConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/chat-config")
public class AdminChatConfigController {

    @Autowired
    private AdminChatConfigService configService;

    @GetMapping("/all")
    public ResponseEntity<List<AiConfiguration>> getAllConfigs() {
        return ResponseEntity.ok(configService.getAllConfigs());
    }

    @GetMapping("/map")
    public ResponseEntity<Map<String, String>> getAllConfigsAsMap() {
        return ResponseEntity.ok(configService.getAllConfigsAsMap());
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateConfig(@RequestBody ChatConfigDTO dto) {
        try {
            AiConfiguration config = configService.updateConfig(
                    dto.getConfigKey(),
                    dto.getConfigValue(),
                    dto.getDescription()
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật thành công!",
                    "config", config
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Cập nhật thất bại: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createConfig(@RequestBody ChatConfigDTO dto) {
        try {
            AiConfiguration config = configService.createConfig(
                    dto.getConfigKey(),
                    dto.getConfigValue(),
                    dto.getDescription()
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Tạo cấu hình thành công!",
                    "config", config
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Tạo cấu hình thất bại: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/delete/{key}")
    public ResponseEntity<?> deleteConfig(@PathVariable String key) {
        try {
            configService.deleteConfig(key);
            return ResponseEntity.ok(Map.of("message", "Xóa cấu hình thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Xóa thất bại: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/test-connection")
    public ResponseEntity<?> testConnection() {
        String result = configService.testAiConnection();
        return ResponseEntity.ok(Map.of("result", result));
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getConfigCategories() {
        Map<String, List<String>> categories = new HashMap<>();
        categories.put("AI Settings", List.of(
                "SYSTEM_PROMPT", "AI_MODEL", "TEMPERATURE", "GROQ_API_KEY", "GROQ_API_URL"
        ));
        categories.put("Business Info", List.of(
                "SHOP_POLICY", "FEATURED_PRODUCTS_CONTEXT", "SHOP_ADDRESS", "HOTLINE"
        ));
        return ResponseEntity.ok(categories);
    }
}