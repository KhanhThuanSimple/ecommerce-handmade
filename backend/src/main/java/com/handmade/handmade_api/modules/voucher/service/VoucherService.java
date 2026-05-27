package com.handmade.handmade_api.modules.voucher.service;

import com.handmade.handmade_api.modules.voucher.dto.VoucherRequest;
import com.handmade.handmade_api.modules.voucher.entity.Voucher;
import com.handmade.handmade_api.modules.voucher.repository.VoucherRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public VoucherService(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    @Transactional
    public Voucher createVoucher(VoucherRequest request) {
        Voucher voucher = Voucher.builder()
                .id(request.getId())
                .code(request.getCode())
                .title(request.getTitle())
                .voucherType(request.getType())
                .valueAmount(request.getValue())
                .maxDiscountAmount(request.getMaxDiscount())
                .minOrderAmount(request.getMinOrder() != null ? request.getMinOrder() : 0.0)
                .usageLimit(request.getQuantity() != null ? request.getQuantity() : 0)
                .usedCount(request.getUsed() != null ? request.getUsed() : 0)
                .build();
        return voucherRepository.save(voucher);
    }

    public Optional<Voucher> findByCode(String code) {
        return voucherRepository.findByCode(code);
    }

    @Transactional
    public Voucher applyVoucherCode(String code) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy voucher: " + code));

        int used = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
        int limit = voucher.getUsageLimit() == null ? 0 : voucher.getUsageLimit();
        if (limit > 0 && used >= limit) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voucher không còn lượt sử dụng: " + code);
        }

        voucher.setUsedCount(used + 1);
        return voucherRepository.save(voucher);
    }

    @Transactional
    public Voucher updateVoucher(String id, Map<String, Object> updates) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher: " + id));

        if (updates.containsKey("used")) {
            voucher.setUsedCount(((Number) updates.get("used")).intValue());
        }
        if (updates.containsKey("quantity")) {
            voucher.setUsageLimit(((Number) updates.get("quantity")).intValue());
        }

        return voucherRepository.save(voucher);
    }
}
