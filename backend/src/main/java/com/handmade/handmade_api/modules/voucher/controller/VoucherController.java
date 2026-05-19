package com.handmade.handmade_api.modules.voucher.controller;

import com.handmade.handmade_api.modules.voucher.dto.VoucherRequest;
import com.handmade.handmade_api.modules.voucher.entity.Voucher;
import com.handmade.handmade_api.modules.voucher.service.VoucherService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/voucher")
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping
    public ResponseEntity<List<Voucher>> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @PostMapping
    public ResponseEntity<Voucher> createVoucher(@Valid @RequestBody VoucherRequest request) {
        return ResponseEntity.ok(voucherService.createVoucher(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Voucher> updateVoucher(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(voucherService.updateVoucher(id, updates));
    }
}
