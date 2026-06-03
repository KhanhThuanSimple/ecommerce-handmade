package com.handmade.handmade_api.modules.adminlukywheel.controller;

import com.handmade.handmade_api.modules.luckywheel.entity.Prize;
import com.handmade.handmade_api.modules.luckywheel.repository.PrizeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/lucky-wheel")
@PreAuthorize("hasRole('ADMIN')")
public class PrizeAdminController {

    private final PrizeRepository prizeRepository;

    public PrizeAdminController(PrizeRepository prizeRepository) {
        this.prizeRepository = prizeRepository;
    }

    @GetMapping("/prizes")
    public ResponseEntity<List<Prize>> getAllPrizes() {
        return ResponseEntity.ok(prizeRepository.findAll());
    }

    @GetMapping("/prizes/{id}")
    public ResponseEntity<Prize> getPrizeById(@PathVariable Long id) {
        return prizeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/prizes")
    public ResponseEntity<Prize> createPrize(@RequestBody Prize prize) {
        Prize saved = prizeRepository.save(prize);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/prizes/{id}")
    public ResponseEntity<Prize> updatePrize(@PathVariable Long id, @RequestBody Prize prize) {
        if (!prizeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        prize.setId(id);
        Prize updated = prizeRepository.save(prize);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/prizes/{id}")
    public ResponseEntity<?> deletePrize(@PathVariable Long id) {
        if (!prizeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        prizeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Xóa giải thưởng thành công!"));
    }

    @PatchMapping("/prizes/{id}/toggle")
    public ResponseEntity<?> togglePrizeStatus(@PathVariable Long id) {
        // Nếu có trường active thì thêm logic
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công"));
    }
}