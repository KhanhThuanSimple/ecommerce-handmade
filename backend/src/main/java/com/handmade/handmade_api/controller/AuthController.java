package com.handmade.handmade_api.controller;

import com.handmade.handmade_api.entity.LoginRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController

@RequestMapping("/api")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        System.out.println("EMAIL: " + loginRequest.getEmail());
        System.out.println("PASS: " + loginRequest.getPassword());
        // 1. Tạo đối tượng xác thực từ Email và Password gửi lên
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Thiết lập trạng thái đăng nhập vào hệ thống
        SecurityContextHolder.getContext().setAuthentication(authentication);

        return ResponseEntity.ok("Đăng nhập thành công!");
    }
}