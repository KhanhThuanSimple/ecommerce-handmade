package com.handmade.handmade_api.modules.luckywheel.service;

import com.handmade.handmade_api.modules.auth.entity.User;
import com.handmade.handmade_api.modules.luckywheel.entity.UserSpinProfile;
import com.handmade.handmade_api.modules.luckywheel.repository.UserSpinProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;

@Service
public class LuckyWheelService {

    private final UserSpinProfileRepository userSpinProfileRepository;

    public LuckyWheelService(UserSpinProfileRepository userSpinProfileRepository) {
        this.userSpinProfileRepository = userSpinProfileRepository;
    }

    @Transactional
    public UserSpinProfile updateSpinProfile(User user, Integer pointsRequest, String lastSpinDateRequest) {
        if (pointsRequest == null && lastSpinDateRequest == null) {
            return user.getSpinProfile();
        }

        // Tìm hoặc tự động tạo mới Profile gắn liền với User theo @MapsId
        UserSpinProfile profile = userSpinProfileRepository.findById(user.getId())
                .orElseGet(() -> {
                    UserSpinProfile newProfile = new UserSpinProfile();
                    newProfile.setUser(user);
                    newProfile.setPoints(0);
                    return newProfile;
                });

        // Xử lý cộng dồn điểm thưởng
        if (pointsRequest != null) {
            int currentPoints = (profile.getPoints() == null) ? 0 : profile.getPoints();
            profile.setPoints(currentPoints + pointsRequest);
        }

        // Xử lý biến đổi chuỗi ISO thời gian từ FE
        if (lastSpinDateRequest != null) {
            try {
                LocalDateTime ldt = OffsetDateTime.parse(lastSpinDateRequest).toLocalDateTime();
                profile.setLastSpinDate(ldt);
            } catch (DateTimeParseException ignored) {
                // Bỏ qua nếu chuỗi ngày gửi lên sai định dạng ISO
            }
        }

        UserSpinProfile savedProfile = userSpinProfileRepository.save(profile);
        user.setSpinProfile(savedProfile); // Đồng bộ lại cache Object trong cùng Request
        return savedProfile;
    }
}