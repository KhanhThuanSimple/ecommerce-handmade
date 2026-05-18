package com.handmade.handmade_api.modules.auth.repository;

import com.handmade.handmade_api.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring sẽ tự động tạo câu query tìm user theo email
    Optional<User> findByEmail(String email);

    // Kiểm tra xem email đã tồn tại chưa (dùng cho Đăng ký)
    Boolean existsByEmail(String email);
}