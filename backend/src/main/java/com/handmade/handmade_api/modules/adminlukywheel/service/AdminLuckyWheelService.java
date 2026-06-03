package com.handmade.handmade_api.modules.adminlukywheel.service;


import com.handmade.handmade_api.modules.auth.entity.User;
import com.handmade.handmade_api.modules.auth.repository.UserRepository;
import com.handmade.handmade_api.modules.luckywheel.entity.UserSpinProfile;
import com.handmade.handmade_api.modules.luckywheel.repository.UserSpinProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AdminLuckyWheelService {

    private final UserSpinProfileRepository spinProfileRepository;
    private final UserRepository userRepository;

    public AdminLuckyWheelService(UserSpinProfileRepository spinProfileRepository, UserRepository userRepository) {
        this.spinProfileRepository = spinProfileRepository;
        this.userRepository = userRepository;
    }

    public List<UserSpinProfile> getAllSpinProfiles() {
        return spinProfileRepository.findAll();
    }

    public UserSpinProfile getSpinProfileByUserId(Long userId) {
        return spinProfileRepository.findById(userId).orElse(null);
    }

    @Transactional
    public UserSpinProfile addPointsToUser(Long userId, Integer points) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserSpinProfile profile = spinProfileRepository.findById(userId)
                .orElseGet(() -> {
                    UserSpinProfile newProfile = new UserSpinProfile();
                    newProfile.setUser(user);
                    newProfile.setPoints(0);
                    return newProfile;
                });

        int currentPoints = profile.getPoints() != null ? profile.getPoints() : 0;
        profile.setPoints(currentPoints + points);

        return spinProfileRepository.save(profile);
    }

    @Transactional
    public UserSpinProfile resetSpinLimit(Long userId) {
        UserSpinProfile profile = spinProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Spin profile not found"));

        profile.setLastSpinDate(null);
        return spinProfileRepository.save(profile);
    }

    public Map<String, Object> getStatistics() {
        List<UserSpinProfile> profiles = spinProfileRepository.findAll();

        long totalUsers = profiles.size();
        int totalPoints = profiles.stream()
                .mapToInt(p -> p.getPoints() != null ? p.getPoints() : 0)
                .sum();
        long usersSpunToday = profiles.stream()
                .filter(p -> p.getLastSpinDate() != null &&
                        p.getLastSpinDate().toLocalDate().equals(LocalDateTime.now().toLocalDate()))
                .count();

        return Map.of(
                "totalUsers", totalUsers,
                "totalPoints", totalPoints,
                "usersSpunToday", usersSpunToday,
                "averagePoints", totalUsers > 0 ? totalPoints / totalUsers : 0
        );
    }
}