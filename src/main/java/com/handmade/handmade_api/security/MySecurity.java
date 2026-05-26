package com.handmade.handmade_api.security;

import com.handmade.handmade_api.modules.auth.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MySecurity {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return email -> userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider auth = new DaoAuthenticationProvider();
        auth.setUserDetailsService(userDetailsService);
        auth.setPasswordEncoder(passwordEncoder);
        return auth;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, DaoAuthenticationProvider authProvider) throws Exception {
        http
                .authenticationProvider(authProvider)
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable()) // Tắt CSRF để hỗ trợ gọi API từ bên ngoài (Postman/Bruno/Frontend)
                .authorizeHttpRequests(auth -> auth

                        // ==========================================
                        // NHÓM 1: ADMIN - QUẢN TRỊ HỆ THỐNG (CHẶN TRÊN CÙNG)
                        // ==========================================
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Chặn ghi/sửa/xoá Sản phẩm và Danh mục: Chỉ cho phép ADMIN hành động
                        .requestMatchers(HttpMethod.POST, "/api/products/**", "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**", "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**", "/api/categories/**").hasRole("ADMIN")


                        // ==========================================
                        // NHÓM 2: USER & ADMIN - CHỨC NĂNG CẦN ĐĂNG NHẬP
                        // ==========================================
                        .requestMatchers("/api/users/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/reviews/**").hasAnyRole("USER", "ADMIN")

                        // Các chức năng liên quan đến Đặt hàng & Thanh toán (Checkout) phải đăng nhập
                        .requestMatchers("/api/orders/**", "/api/checkout/**").hasAnyRole("USER", "ADMIN")


                        // ==========================================
                        // NHÓM 3: PUBLIC APIS - AI CŨNG CÓ THỂ TRUY CẬP (XEM CHUNG)
                        // ==========================================
                        .requestMatchers("/api/auth/**").permitAll() // Đăng ký, đăng nhập
                        .requestMatchers("/api/client/checkout/callback-verify").permitAll() // Webhook thanh toán (VNPAY/MoMo)

                        // Mở cổng Giỏ hàng tự do cho cả khách ẩn danh và thành viên thao tác công khai
                        .requestMatchers("/api/carts/**").permitAll()

                        // Chỉ cho phép tất cả mọi người XEM (GET) thông tin sản phẩm, danh mục, đánh giá
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-images/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()


                        // ==========================================
                        // BẢO VỆ CUỐI CÙNG: Các link phát sinh khác đều phải xác thực
                        // ==========================================
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}