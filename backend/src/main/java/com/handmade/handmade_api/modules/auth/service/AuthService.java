package com.handmade.handmade_api.modules.auth.service;

import com.handmade.handmade_api.modules.auth.repository.UserRepository;
import com.handmade.handmade_api.modules.auth.repository.RoleRepository; // 1. Thêm import này
import com.handmade.handmade_api.modules.auth.entity.Role;               // 2. Thêm import này
import com.handmade.handmade_api.modules.auth.dto.AuthResponse;
import com.handmade.handmade_api.modules.auth.dto.LoginRequest;
import com.handmade.handmade_api.modules.auth.dto.RegisterRequest;
import com.handmade.handmade_api.modules.auth.entity.User;
import com.handmade.handmade_api.security.JwtService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository; // 3. Tiêm RoleRepository vào đây

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired private JwtService jwtService; // Đã thêm

    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        String jwtToken = jwtService.generateToken(user);

        AuthResponse res = new AuthResponse();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setFullName(user.getFullName());
        res.setToken(jwtToken);
        res.setRoles(user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).collect(Collectors.toList()));
        return res;
    }

    @Transactional
    public String register(RegisterRequest reg) {
        try {
            System.out.println("Đang kiểm tra email: " + reg.getEmail());
            if (userRepository.existsByEmail(reg.getEmail())) {
                return "Lỗi: Email đã tồn tại!";
            }

            // 4. Tìm kiếm thực thể Role từ Database
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy quyền ROLE_USER trong hệ thống!"));

            // 5. Tạo User mới
            User newUser = new User();
            newUser.setEmail(reg.getEmail());
            newUser.setUsername(reg.getUsername());
            newUser.setFullName(reg.getFullName());
            newUser.setPhone(reg.getPhone());
            newUser.setPassword(passwordEncoder.encode(reg.getPassword()));
            newUser.setEnabled(true);

            // FIX QUAN TRỌNG: Truyền đúng một Set<Role> chứa đối tượng Role thật từ DB vào
            newUser.setRoles(Collections.singleton(userRole));

            System.out.println("Đang chuẩn bị lưu user...");
            User savedUser = userRepository.save(newUser);
            System.out.println("Lưu thành công ID: " + savedUser.getId());

            return "Đăng ký thành công!";
        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi hệ thống: " + e.getMessage();
        }
    }
}