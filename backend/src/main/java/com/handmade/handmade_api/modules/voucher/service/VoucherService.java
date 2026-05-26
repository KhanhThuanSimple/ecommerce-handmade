package com.handmade.handmade_api.modules.voucher.service;

import com.handmade.handmade_api.modules.voucher.dto.VoucherRequest;
import com.handmade.handmade_api.modules.voucher.entity.Voucher;
import com.handmade.handmade_api.modules.voucher.repository.VoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .description(request.getDescription())
                .type(request.getType())
                .value(request.getValue())
                .maxDiscount(request.getMaxDiscount())
                .minOrder(request.getMinOrder())
                .target(request.getTarget())
                .userId(request.getUserId())
                .maxOrderCount(request.getMaxOrderCount())
                .quantity(request.getQuantity())
                .used(request.getUsed())
                .status(request.getStatus())
                .startDate(request.getStartDate())
                .expiredAt(request.getExpiredAt())
                .build();
        return voucherRepository.save(voucher);
    }

    public Optional<Voucher> findByCode(String code) {
        return voucherRepository.findByCode(code);
    }

    @Transactional
    public Voucher applyVoucherCode(String code) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher: " + code));

        if (voucher.getStatus() != null && voucher.getStatus().equalsIgnoreCase("expired")) {
            throw new RuntimeException("Voucher đã hết hạn hoặc không hợp lệ: " + code);
        }

        int used = voucher.getUsed() == null ? 0 : voucher.getUsed();
        if (voucher.getQuantity() != null && used >= voucher.getQuantity()) {
            throw new RuntimeException("Voucher không còn lượt sử dụng: " + code);
        }

        voucher.setUsed(used + 1);
        return voucherRepository.save(voucher);
    }

    @Transactional
    public Voucher updateVoucher(String id, Map<String, Object> updates) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher: " + id));

        if (updates.containsKey("used")) {
            voucher.setUsed(((Number) updates.get("used")).intValue());
        }
        if (updates.containsKey("status")) {
            voucher.setStatus((String) updates.get("status"));
        }
        if (updates.containsKey("quantity")) {
            voucher.setQuantity(((Number) updates.get("quantity")).intValue());
        }

        return voucherRepository.save(voucher);
    }
}
