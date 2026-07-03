package com.handmade.handmade_api.modules.voucher.service;

import com.handmade.handmade_api.modules.voucher.dto.VoucherRequest;
import com.handmade.handmade_api.modules.voucher.entity.Voucher;
import com.handmade.handmade_api.modules.voucher.repository.VoucherRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public VoucherService(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    @Cacheable(value = "vouchers", key = "'all'")
    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    @Transactional
    @CacheEvict(value = "vouchers", allEntries = true)
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
                .userId(request.getUserId())
                .target(request.getTarget())
                .status(request.getStatus())
                .startDate(request.getStartDate())
                .expiredAt(request.getExpiredAt())
                .build();
        return voucherRepository.save(voucher);
    }

    @Cacheable(value = "vouchers", key = "#code")
    public Optional<Voucher> findByCode(String code) {
        return voucherRepository.findByCode(code);
    }

    @Transactional
    @CacheEvict(value = "vouchers", allEntries = true)
    public Voucher applyVoucherCode(String code) {
        return applyVoucherCode(code, null);
    }

    @Transactional
    @CacheEvict(value = "vouchers", allEntries = true)
    public Voucher applyVoucherCode(String code, Long userId) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy voucher: " + code));

        // Kiểm tra đối tượng sở hữu nếu là voucher cá nhân (SPECIFIC_USER)
        if ("SPECIFIC_USER".equalsIgnoreCase(voucher.getTarget()) && voucher.getUserId() != null) {
            if (userId == null || !voucher.getUserId().equals(userId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã giảm giá này không thuộc sở hữu của bạn!");
            }
        }

        int used = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
        int limit = voucher.getUsageLimit() == null ? 0 : voucher.getUsageLimit();
        if (limit > 0 && used >= limit) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voucher không còn lượt sử dụng: " + code);
        }

        voucher.setUsedCount(used + 1);
        return voucherRepository.save(voucher);
    }

    @Transactional
    @CacheEvict(value = "vouchers", allEntries = true)
    public Voucher updateVoucher(String id, Map<String, Object> updates) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher: " + id));

        if (updates.containsKey("code")) {
            voucher.setCode((String) updates.get("code"));
        }
        if (updates.containsKey("title")) {
            voucher.setTitle((String) updates.get("title"));
        }
        if (updates.containsKey("type")) {
            voucher.setVoucherType((String) updates.get("type"));
        }
        if (updates.containsKey("value")) {
            voucher.setValueAmount(((Number) updates.get("value")).doubleValue());
        }
        if (updates.containsKey("maxDiscount")) {
            voucher.setMaxDiscountAmount(updates.get("maxDiscount") != null ? ((Number) updates.get("maxDiscount")).doubleValue() : null);
        }
        if (updates.containsKey("minOrder")) {
            voucher.setMinOrderAmount(updates.get("minOrder") != null ? ((Number) updates.get("minOrder")).doubleValue() : null);
        }
        if (updates.containsKey("quantity")) {
            voucher.setUsageLimit(updates.get("quantity") != null ? ((Number) updates.get("quantity")).intValue() : null);
        }
        if (updates.containsKey("used")) {
            voucher.setUsedCount(updates.get("used") != null ? ((Number) updates.get("used")).intValue() : null);
        }
        if (updates.containsKey("userId")) {
            voucher.setUserId(updates.get("userId") != null ? ((Number) updates.get("userId")).longValue() : null);
        }
        if (updates.containsKey("target")) {
            voucher.setTarget((String) updates.get("target"));
        }
        if (updates.containsKey("status")) {
            voucher.setStatus((String) updates.get("status"));
        }
        if (updates.containsKey("startDate")) {
            voucher.setStartDate((String) updates.get("startDate"));
        }
        if (updates.containsKey("expiredAt")) {
            voucher.setExpiredAt((String) updates.get("expiredAt"));
        }

        return voucherRepository.save(voucher);
    }

    @Transactional
    @CacheEvict(value = "vouchers", allEntries = true)
    public void deleteVoucher(String id) {
        if (!voucherRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher: " + id);
        }
        voucherRepository.deleteById(id);
    }
}
