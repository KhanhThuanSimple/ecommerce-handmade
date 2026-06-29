package com.handmade.handmade_api.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.access.channel.ChannelProcessingFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class MySecurity {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private UserDetailsService userDetailsService;

    // ✅ Bean CorsFilter
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        
        // ✅ Cho phép frontend domain
        config.setAllowedOriginPatterns(List.of(
            "https://cheerful-rejoicing-production-8efa.up.railway.app",
            "http://localhost:3000"
        ));
        
        // ✅ Cho phép tất cả methods
        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // ✅ Cho phép tất cả headers
        config.setAllowedHeaders(Arrays.asList("*"));
        
        // ✅ Cho phép credentials
        config.setAllowCredentials(true);
        
        // ✅ Cache preflight
        config.setMaxAge(3600L);
        
        // ✅ Expose headers
        config.setExposedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Disposition",
            "X-Total-Count"
        ));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider auth = new DaoAuthenticationProvider();
        auth.setUserDetailsService(userDetailsService);
        auth.setPasswordEncoder(passwordEncoder());
        return auth;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ✅ Đặt CorsFilter lên đầu
            .addFilterBefore(corsFilter(), ChannelProcessingFilter.class)
            
            .csrf(csrf -> csrf.disable())
            
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Cấu hình xử lý lỗi
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    String message = (String) request.getAttribute("exception");
                    if (message == null) message = "Bạn cần đăng nhập để truy cập tài nguyên này.";
                    response.setStatus(401);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"status\": 401, \"message\": \"" + message + "\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"status\": 403, \"message\": \"Bạn không có quyền truy cập vào tài nguyên này.\"}");
                })
            )

            // ===== ĐỊNH NGHĨA QUYỀN TRUY CẬP =====
            .authorizeHttpRequests(auth -> auth
                // ==================== CẤP ĐỘ 0: PREFLIGHT CORS ====================
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Health check
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // Error endpoint
                .requestMatchers("/error").permitAll()

                // Authentication endpoints
                .requestMatchers("/api/auth/**").permitAll()

                // ===== PUBLIC GET ENDPOINTS =====
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/product-images/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/voucher/**").permitAll()

                // Payment public
                .requestMatchers("/api/payment/**").permitAll()

                // Carts public
                .requestMatchers("/api/carts/**").permitAll()

                // ===== CHATBOX PUBLIC =====
                .requestMatchers("/api/chat/**").permitAll()
                .requestMatchers("/api/chat/ask").permitAll()
                .requestMatchers("/api/chat/history/**").permitAll()
                .requestMatchers("/api/chat/session/**").permitAll()

                // ===== LUCKY WHEEL PUBLIC =====
                .requestMatchers(HttpMethod.GET, "/api/prizes").permitAll()
                .requestMatchers("/api/lucky-wheel/spin").permitAll()
                .requestMatchers("/api/lucky-wheel/**").permitAll()

                // ===== TEST ENDPOINTS =====
                .requestMatchers("/api/test/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()

                // ==================== CẤP ĐỘ 2: AUTHENTICATED ====================
                // Lucky wheel authenticated
                .requestMatchers("/api/lucky-wheel/history").authenticated()
                .requestMatchers("/api/lucky-wheel/my-points").authenticated()

                // Reviews POST
                .requestMatchers(HttpMethod.POST, "/api/reviews/**").hasAnyRole("USER", "ADMIN")

                // Users và Orders
                .requestMatchers("/api/users/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/orders/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/admin/orders/**").hasRole("ADMIN")

                // ==================== CẤP ĐỘ 3: ADMIN ====================
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/chat-config/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/chat-faq/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/lucky-wheel/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/lucky-wheel/prizes").hasRole("ADMIN")
                .requestMatchers("/api/admin/lucky-wheel/prizes/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/lucky-wheel/spin-profiles").hasRole("ADMIN")
                .requestMatchers("/api/admin/lucky-wheel/users/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/lucky-wheel/statistics").hasRole("ADMIN")

                // ==================== CẤP ĐỘ 4: MẶC ĐỊNH ====================
                .anyRequest().authenticated()
            )

            // Đặt Filter JWT
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}