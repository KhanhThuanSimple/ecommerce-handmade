package com.handmade.handmade_api.modules.adminUser.controller;

import com.handmade.handmade_api.modules.adminUser.dto.AdminRoleDTO;
import com.handmade.handmade_api.modules.auth.dto.RegisterRequest;
import com.handmade.handmade_api.modules.auth.entity.Role;
import com.handmade.handmade_api.modules.auth.entity.User;
import com.handmade.handmade_api.modules.adminUser.dto.AdminUserDashboardDTO;
import com.handmade.handmade_api.modules.adminUser.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    // ENDPOINT 1: Lấy danh sách thành viên phân trang
    @GetMapping
    public ResponseEntity<Page<AdminUserDashboardDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Page<User> usersPage = adminUserService.getAllUsersPaged(page, size, sortBy, direction);
        Page<AdminUserDashboardDTO> dtoPage = usersPage.map(AdminUserDashboardDTO::new);
        return ResponseEntity.ok(dtoPage);
    }

    // ĐÃ ĐỔI CHỖ LÊN ĐÂY: Ưu tiên đường dẫn tĩnh cố định để tránh lỗi 405 ngầm
    @GetMapping("/roles")
    public ResponseEntity<List<AdminRoleDTO>> getAllSystemRoles() {
        List<Role> roles = adminUserService.getAllRoles();

        List<AdminRoleDTO> roleDTOs = roles.stream()
                .map(AdminRoleDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(roleDTOs);
    }
    // Thêm Endpoint này vào AdminUserController.java
// Nên đặt phía dưới hàm GET /roles để giữ tính ngăn nắp cho Static Path
    @PostMapping("/roles")
    public ResponseEntity<String> createRole(
            @RequestBody AdminRoleDTO roleDTO,
            Principal principal) {
        try {
            // Gọi Service xử lý
            String msg = adminUserService.createNewRole(roleDTO);
            return ResponseEntity.ok(msg);
        } catch (Exception e) {
            // Bắt mọi Exception (kể cả lỗi DB) để trả về mã 400 và in thông điệp lỗi ra Bruno
            return ResponseEntity.badRequest().body("Không thể tạo vai trò: " + e.getMessage());
        }
    }
    // Thêm vào nhóm các hàm chứa {id} ở cuối file AdminUserController.java
    @DeleteMapping("/roles/{id}")
    public ResponseEntity<String> deleteRole(@PathVariable Long id, Principal principal) {
        try {
            String msg = adminUserService.deleteRoleById(id);
            return ResponseEntity.ok(msg);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getLocalizedMessage());
        }
    }

    // CÁC ENDPOINT CHỨA BIẾN ĐỘNG {id} ĐƯỢC ĐẨY XUỐNG DƯỚI CÙNG
    @PatchMapping("/{id}/toggle-lock")
    public ResponseEntity<String> toggleLockUser(@PathVariable Long id, Principal principal) {
        try {
            String msg = adminUserService.toggleLockUser(id, principal.getName());
            return ResponseEntity.ok(msg);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getLocalizedMessage());
        }
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<String> toggleStatusUser(@PathVariable Long id, Principal principal) {
        try {
            String msg = adminUserService.toggleStatusUser(id, principal.getName());
            return ResponseEntity.ok(msg);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getLocalizedMessage());
        }
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<String> assignRolesToUser(
            @PathVariable Long id,
            @RequestBody List<Long> roleIds,
            Principal principal) {
        try {
            String msg = adminUserService.updateUserRoles(id, roleIds, principal.getName());
            return ResponseEntity.ok(msg);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getLocalizedMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, Principal principal) {
        try {
            adminUserService.deleteUserById(id, principal.getName());
            return ResponseEntity.ok("Đã xóa tài khoản thành viên vĩnh viễn khỏi hệ thống!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getLocalizedMessage());
        }
    }
    // Thêm vào AdminUserController.aajava (Nhóm Static Path phía trên)
    @PostMapping
    public ResponseEntity<String> addUserFromAdmin(
            @RequestBody RegisterRequest registerRequest,
            Principal principal) {
        try {
            String msg = adminUserService.createNewUserFromAdmin(registerRequest);
            return ResponseEntity.ok(msg);
        } catch (RuntimeException e) {
            // Trả về mã 400 Bad Request kèm thông điệp lỗi cụ thể để FE hiển thị alert
            return ResponseEntity.badRequest().body(e.getLocalizedMessage());
        }
    }
}