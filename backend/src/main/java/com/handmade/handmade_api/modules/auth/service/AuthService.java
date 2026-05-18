package com.handmade.handmade_api.modules.auth.service;

import com.handmade.handmade_api.modules.auth.repository.UserRepository;
import com.handmade.handmade_api.modules.auth.dto.AuthResponse;
import com.handmade.handmade_api.modules.auth.dto.LoginRequest;
import com.handmade.handmade_api.modules.auth.dto.RegisterRequest;
import com.handmade.handmade_api.modules.auth.entity.User;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest loginRequest) {
        // Xác thực người dùng
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Lấy thông tin user từ DB để trả về đầy đủ cho FE
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        AuthResponse res = new AuthResponse();
        res.setEmail(user.getEmail());
        res.setFullName(user.getFullName());
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority) // Lấy chuỗi "ROLE_ADMIN", "ROLE_USER"...
                .collect(Collectors.toList());

        res.setRoles(roles);
        return res;
    }
    @Transactional // Đảm bảo có Transaction
    public String register(RegisterRequest reg) {
        try {
            // 1. Kiểm tra email
            System.out.println("Đang kiểm tra email: " + reg.getEmail());
            if (userRepository.existsByEmail(reg.getEmail())) {
                return "Lỗi: Email đã tồn tại!";
            }

            // 2. Tạo User
            User newUser = new User();
            newUser.setEmail(reg.getEmail());
            newUser.setUsername(reg.getUsername());
            newUser.setFullName(reg.getFullName());
            newUser.setPhone(reg.getPhone());
            newUser.setPassword(passwordEncoder.encode(reg.getPassword()));
            newUser.setEnabled(true);
            newUser.setRoles(Collections.singleton("ROLE_USER"));

            // 3. Lưu (Đây là đoạn dễ lỗi nhất)
            System.out.println("Đang chuẩn bị lưu user...");
            User savedUser = userRepository.save(newUser);
            System.out.println("Lưu thành công ID: " + savedUser.getId());

            return "Đăng ký thành công!";
        } catch (Exception e) {
            // In lỗi chi tiết ra màn hình console của IntelliJ
            e.printStackTrace();
            return "Lỗi hệ thống: " + e.getMessage();
        }
    }
}