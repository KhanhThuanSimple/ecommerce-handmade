package com.handmade.handmade_api.modules.luckywheel.controller;

import com.handmade.handmade_api.modules.luckywheel.entity.Prize;
import com.handmade.handmade_api.modules.luckywheel.repository.PrizeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/prizes") // Đảm bảo khớp chuẩn xác với endpoint gọi từ React
public class PrizeController {

    private final PrizeRepository prizeRepository;

    public PrizeController(PrizeRepository prizeRepository) {
        this.prizeRepository = prizeRepository;
    }

    @GetMapping
    public ResponseEntity<List<Prize>> getAllPrizes() {
        List<Prize> prizes = prizeRepository.findAll();
        System.out.println("Đang lấy danh sách vòng quay. Số lượng: " + prizes.size());
        return ResponseEntity.ok(prizes);
    }
}