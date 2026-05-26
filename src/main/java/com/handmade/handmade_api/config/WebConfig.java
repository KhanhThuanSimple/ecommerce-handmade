package com.handmade.handmade_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Áp dụng cấu hình cho toàn bộ API endpoint trong hệ thống
                .allowedOriginPatterns("*") // Cho phép tất cả các nguồn nhưng sử dụng mẫu khớp an toàn thay vì dấu '*'
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS") // Cho phép các phương thức HTTP
                .allowedHeaders("*") // Cho phép tất cả các trường Header
                .allowCredentials(true) // Cho phép gửi thông tin xác thực (Token, Basic Auth, Cookies)
                .maxAge(3600); // Lưu cache cấu hình CORS trong vòng 1 tiếng để tối ưu hiệu năng
    }
}