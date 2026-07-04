package com.handmade.handmade_api.modules.luckywheel.service;

import com.handmade.handmade_api.modules.auth.entity.User;
import com.handmade.handmade_api.modules.auth.repository.UserRepository;
import com.handmade.handmade_api.modules.luckywheel.entity.Prize;
import com.handmade.handmade_api.modules.luckywheel.entity.UserSpinProfile;
import com.handmade.handmade_api.modules.luckywheel.repository.PrizeRepository;
import com.handmade.handmade_api.modules.luckywheel.repository.UserSpinProfileRepository;
import com.handmade.handmade_api.modules.voucher.entity.Voucher;
import com.handmade.handmade_api.modules.voucher.repository.VoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class LuckyWheelService {

    private final UserSpinProfileRepository userSpinProfileRepository;
    private final PrizeRepository prizeRepository;
    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;

    public LuckyWheelService(UserSpinProfileRepository userSpinProfileRepository,
                             PrizeRepository prizeRepository,
                             VoucherRepository voucherRepository,
                             UserRepository userRepository) {
        this.userSpinProfileRepository = userSpinProfileRepository;
        this.prizeRepository = prizeRepository;
        this.voucherRepository = voucherRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public UserSpinProfile updateSpinProfile(User user, Integer pointsRequest, String lastSpinDateRequest) {
        if (pointsRequest == null && lastSpinDateRequest == null) {
            return user.getSpinProfile();
        }

        UserSpinProfile profile = userSpinProfileRepository.findById(user.getId())
                .orElseGet(() -> {
                    UserSpinProfile newProfile = new UserSpinProfile();
                    newProfile.setUser(user);
                    newProfile.setPoints(0);
                    return newProfile;
                });

        if (pointsRequest != null) {
            int currentPoints = (profile.getPoints() == null) ? 0 : profile.getPoints();
            profile.setPoints(currentPoints + pointsRequest);
        }

        if (lastSpinDateRequest != null) {
            try {
                LocalDateTime ldt = OffsetDateTime.parse(lastSpinDateRequest).toLocalDateTime();
                profile.setLastSpinDate(ldt);
            } catch (DateTimeParseException ignored) {}
        }

        UserSpinProfile savedProfile = userSpinProfileRepository.save(profile);
        user.setSpinProfile(savedProfile);
        return savedProfile;
    }

    @Transactional
    public Prize spin(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        UserSpinProfile profile = userSpinProfileRepository.findById(userId)
                .orElseGet(() -> {
                    UserSpinProfile newProfile = new UserSpinProfile();
                    newProfile.setUser(user);
                    newProfile.setPoints(0);
                    return newProfile;
                });

        if (profile.getLastSpinDate() != null && profile.getLastSpinDate().toLocalDate().equals(LocalDate.now())) {
            throw new RuntimeException("HẾT_LƯỢT");
        }

        List<Prize> prizes = prizeRepository.findAll();
        if (prizes.isEmpty()) throw new RuntimeException("Chưa cấu hình vòng quay");

        Random rand = new Random();
        Prize wonPrize = prizes.get(rand.nextInt(prizes.size()));

        profile.setLastSpinDate(LocalDateTime.now());

        if ("points".equalsIgnoreCase(wonPrize.getType())) {
            profile.setPoints((profile.getPoints() == null ? 0 : profile.getPoints()) + (wonPrize.getValue() != null ? wonPrize.getValue() : 0));
        } else if ("voucher".equalsIgnoreCase(wonPrize.getType()) || "discount".equalsIgnoreCase(wonPrize.getType())) {
            Voucher voucher = new Voucher();
            voucher.setId(UUID.randomUUID().toString());
            voucher.setCode("LUCKY_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            voucher.setTitle("Voucher Vòng Quay: " + wonPrize.getName());
            voucher.setVoucherType("discount".equalsIgnoreCase(wonPrize.getType()) ? "PERCENTAGE" : "FIXED_AMOUNT");
            voucher.setValueAmount(wonPrize.getValue() != null ? Double.valueOf(wonPrize.getValue()) : 10.0);
            voucher.setUsageLimit(1);
            voucher.setUsedCount(0);
            voucher.setUserId(userId);
            voucher.setTarget("PERSONAL");
            voucher.setStatus("ACTIVE");
            voucher.setStartDate(LocalDate.now().toString());
            voucher.setExpiredAt(LocalDate.now().plusDays(30).toString());
            voucherRepository.save(voucher);
        }

        userSpinProfileRepository.save(profile);
        return wonPrize;
    }
}