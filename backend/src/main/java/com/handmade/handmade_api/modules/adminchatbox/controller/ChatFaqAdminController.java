// ChatFaqAdminController.java
package com.handmade.handmade_api.modules.adminchatbox.controller;

import com.handmade.handmade_api.modules.chatbox.entity.ChatFaq;
import com.handmade.handmade_api.modules.chatbox.repository.ChatFaqRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/chat-faq")
public class ChatFaqAdminController {

    @Autowired
    private ChatFaqRepository faqRepo;

    @GetMapping("/all")
    public ResponseEntity<List<ChatFaq>> getAllFaqs() {
        return ResponseEntity.ok(faqRepo.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ChatFaq>> getActiveFaqs() {
        return ResponseEntity.ok(faqRepo.findByIsActiveTrue());
    }

    @PostMapping("/create")
    public ResponseEntity<?> createFaq(@RequestBody ChatFaq faq) {
        try {
            ChatFaq saved = faqRepo.save(faq);
            return ResponseEntity.ok(Map.of(
                    "message", "Tạo FAQ thành công!",
                    "faq", saved
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Tạo thất bại: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateFaq(@PathVariable Long id, @RequestBody ChatFaq faq) {
        try {
            faq.setId(id);
            ChatFaq updated = faqRepo.save(faq);
            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật FAQ thành công!",
                    "faq", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Cập nhật thất bại: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteFaq(@PathVariable Long id) {
        try {
            faqRepo.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Xóa FAQ thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Xóa thất bại: " + e.getMessage()
            ));
        }
    }

    @PatchMapping("/toggle/{id}")
    public ResponseEntity<?> toggleFaqStatus(@PathVariable Long id) {
        try {
            ChatFaq faq = faqRepo.findById(id).orElseThrow();
            faq.setIsActive(!faq.getIsActive());
            faqRepo.save(faq);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã " + (faq.getIsActive() ? "kích hoạt" : "vô hiệu hóa") + " FAQ!",
                    "isActive", faq.getIsActive()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Thao tác thất bại: " + e.getMessage()
            ));
        }
    }
}