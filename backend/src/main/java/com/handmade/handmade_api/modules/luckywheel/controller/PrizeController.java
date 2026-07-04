package com.handmade.handmade_api.modules.luckywheel.controller;

import com.handmade.handmade_api.modules.luckywheel.entity.Prize;
import com.handmade.handmade_api.modules.luckywheel.repository.PrizeRepository;
import com.handmade.handmade_api.modules.luckywheel.service.LuckyWheelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/prizes")
public class PrizeController {

    private final PrizeRepository prizeRepository;
    private final LuckyWheelService luckyWheelService;

    public PrizeController(PrizeRepository prizeRepository, LuckyWheelService luckyWheelService) {
        this.prizeRepository = prizeRepository;
        this.luckyWheelService = luckyWheelService;
    }

    @GetMapping
    public ResponseEntity<List<Prize>> getAllPrizes() {
        List<Prize> prizes = prizeRepository.findAll();
        return ResponseEntity.ok(prizes);
    }

    @PostMapping("/spin/{userId}")
    public ResponseEntity<?> spin(@PathVariable Long userId) {
        try {
            Prize wonPrize = luckyWheelService.spin(userId);
            return ResponseEntity.ok(wonPrize);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }
}