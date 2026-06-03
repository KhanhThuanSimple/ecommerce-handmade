package com.handmade.handmade_api.modules.adminlukywheel.controller;

import com.handmade.handmade_api.modules.adminlukywheel.service.AdminLuckyWheelService;
import com.handmade.handmade_api.modules.luckywheel.entity.UserSpinProfile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/lucky-wheel")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLuckyWheelController {
    private final AdminLuckyWheelService adminService;

    public AdminLuckyWheelController(AdminLuckyWheelService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/users/{userId}/points")
    public ResponseEntity<?> addPoints(@PathVariable Long userId, @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(adminService.addPointsToUser(userId, body.get("points")));
    }

    @PostMapping("/users/{userId}/reset")
    public ResponseEntity<?> resetSpin(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.resetSpinLimit(userId));
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(adminService.getStatistics());
    }
    // Thêm method này vào AdminLuckyWheelController.java

    @GetMapping("/profiles")
    public ResponseEntity<List<UserSpinProfile>> getAllProfiles() {
        return ResponseEntity.ok(adminService.getAllSpinProfiles());
    }
}