package com.handmade.handmade_api.modules.adminUser.service;

import com.handmade.handmade_api.modules.adminUser.dto.RoleDTO;
import com.handmade.handmade_api.modules.auth.dto.RegisterRequest;
import com.handmade.handmade_api.modules.auth.entity.Role;
import com.handmade.handmade_api.modules.auth.entity.User;
import com.handmade.handmade_api.modules.auth.repository.RoleRepository;
import com.handmade.handmade_api.modules.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @Autowired
    private RoleRepository roleRepository;
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    // XỬ LÝ 6: Gán/Thay đổi danh sách Role cho một người dùng
    @Transactional
    public String updateUserRoles(Long userId, List<Long> roleIds, String adminEmail) {
        // 1. Tìm người dùng cần gán quyền
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng cần gán quyền."));

        // RÀNG BUỘC BẢO MẬT: Không cho phép Admin tự hạ quyền hoặc thay đổi Role của chính mình
        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new RuntimeException("Cảnh báo bảo mật: Bạn không thể tự thay đổi quyền hạn của chính mình!");
        }

        // 2. Tìm danh sách các Role thật từ DB dựa trên list ID gửi lên
        List<Role> targetRoles = roleRepository.findAllById(roleIds);
        if (targetRoles.isEmpty()) {
            throw new RuntimeException("Lỗi: Danh sách quyền chọn lựa không hợp lệ hoặc trống!");
        }

        // 3. Gán tập hợp quyền mới (Chuyển List sang Set để đồng bộ Entity)
        Set<Role> newRolesSet = new HashSet<>(targetRoles);
        user.setRoles(newRolesSet);

        // 4. Lưu lại thay đổi vào DB
        userRepository.save(user);
        return "Cập nhật quyền hạn cho tài khoản " + user.getUsername() + " thành công!";
    }

    // CHỨC NĂNG 1: Lấy danh sách phân trang (Đơn giản - Không bộ lọc)
    public Page<User> getAllUsersPaged(int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        return userRepository.findAll(pageable);
    }

    // CHỨC NĂNG 2: Khóa / Mở khóa tài khoản
    @Transactional
    public String toggleLockUser(Long id, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new RuntimeException("Cảnh báo bảo mật: Bạn không thể tự khóa chính mình!");
        }

        user.setAccountNonLocked(!user.isAccountNonLocked());
        userRepository.save(user);
        return user.isAccountNonLocked() ? "Mở khóa tài khoản thành công" : "Khóa tài khoản thành công";
    }
    // Thêm hàm tạo mới Role vào AdminUserService.java
    @Transactional
    public String createNewRole(RoleDTO roleDTO) {
        // 1. Kiểm tra xem mã quyền (Ví dụ: ROLE_STAFF) đã tồn tại chưa
        String roleName = roleDTO.getName().trim().toUpperCase();

        // Tự động thêm tiền tố ROLE_ nếu Front-End quên không nhập đúng chuẩn Spring Security
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        if (roleRepository.findByName(roleName).isPresent()) {
            throw new RuntimeException("Lỗi: Mã quyền " + roleName + " đã tồn tại trong hệ thống!");
        }

        // 2. Chuyển đổi dữ liệu từ DTO sang Entity để lưu
        Role newRole = new Role();
        newRole.setName(roleName);
        newRole.setDisplayName(roleDTO.getDisplayName().trim());
        newRole.setColor(roleDTO.getColor() != null ? roleDTO.getColor().trim() : "#6b7280");

        // 3. Lưu xuống Database
        roleRepository.save(newRole);
        return "Thêm vai trò mới '" + roleDTO.getDisplayName() + "' thành công!";
    }
    // CHỨC NĂNG 3: Thay đổi trạng thái hoạt động (Kích hoạt / Vô hiệu hóa)
    @Transactional
    public String toggleStatusUser(Long id, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new RuntimeException("Cảnh báo bảo mật: Bạn không thể tự vô hiệu hóa chính mình!");
        }

        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        return user.isEnabled() ? "Kích hoạt tài khoản thành công" : "Vô hiệu hóa tài khoản thành công";
    }
    // Thêm vào cuối file AdminUserService.java
    @Transactional
    public String deleteRoleById(Long roleId) {
        // 1. Kiểm tra xem Role có tồn tại hay không
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy vai trò có ID = " + roleId + " trên hệ thống!"));

        // 2. RÀNG BUỘC BẢO MẬT: Ngăn chặn xóa các quyền tối cao cốt lõi của hệ thống
        if (role.getName().equalsIgnoreCase("ROLE_ADMIN") || role.getName().equalsIgnoreCase("ROLE_USER")) {
            throw new RuntimeException("Quy trình bị từ chối: Không được phép xóa các vai trò cốt lõi của hệ thống (ADMIN/USER)!");
        }

        // 3. Thực hiện xóa (PostgreSQL sẽ tự động CASCADE xóa liên kết ở bảng user_roles)
        roleRepository.delete(role);

        return "Đã xóa vai trò '" + role.getDisplayName() + "' và hủy quyền này khỏi tất cả tài khoản liên quan thành công!";
    }

    // CHỨC NĂNG 4: Xóa vĩnh viễn tài khoản
    @Transactional
    public void deleteUserById(Long id, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại trên hệ thống!"));

        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new RuntimeException("Cảnh báo bảo mật: Bạn không thể tự xóa chính mình!");
        }
        userRepository.delete(user);
    }
    // Thêm vào cuối file AdminUserService.java
    @Transactional
    public String createNewUserFromAdmin(RegisterRequest reg) {
        // 1. Kiểm tra trùng lặp Tên đăng nhập (Username)
        if (userRepository.existsByUsername(reg.getUsername().trim())) {
            throw new RuntimeException("Tên đăng nhập '" + reg.getUsername().trim() + "' đã tồn tại trên hệ thống!");
        }

        // 2. Kiểm tra trùng lặp Email
        if (userRepository.existsByEmail(reg.getEmail().trim())) {
            throw new RuntimeException("Email '" + reg.getEmail().trim() + "' đã được đăng ký bởi tài khoản khác!");
        }

        // 3. Khởi tạo thực thể User mới
        User newUser = new User();
        newUser.setUsername(reg.getUsername().trim());
        newUser.setEmail(reg.getEmail().trim());
        newUser.setFullName(reg.getFullName().trim());
        newUser.setPhone(reg.getPhone() != null ? reg.getPhone().trim() : null);

        // 4. Mã hóa mật khẩu an toàn qua BCrypt
        newUser.setPassword(passwordEncoder.encode(reg.getPassword()));
        newUser.setEnabled(true);
        newUser.setAccountNonLocked(true);

        // 5. Xử lý gán danh sách vai trò động từ dữ liệu Client gửi lên
        // (RegisterRequest chứa List<String> roles như: ["ROLE_USER", "ROLE_STAFF"])
        Set<Role> assignedRoles = new HashSet<>();
        if (reg.getRoles() != null && !reg.getRoles().isEmpty()) {
            for (String roleName : reg.getRoles()) {
                Role dbRole = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò '" + roleName + "' trong hệ thống!"));
                assignedRoles.add(dbRole);
            }
        } else {
            // Mặc định nếu không chọn gì sẽ là quyền USER thường
            Role defaultRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không tìm thấy quyền mặc định ROLE_USER!"));
            assignedRoles.add(defaultRole);
        }

        newUser.setRoles(assignedRoles);

        // 6. Lưu xuống PostgreSQL
        userRepository.save(newUser);
        return "Khởi tạo thành công tài khoản @" + newUser.getUsername() + "!";
    }
}