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
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableWebSecurity
public class MySecurity {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private CorsFilter corsFilter;  // ✅ Inject từ CorsConfig

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
            // ✅ Dùng CorsFilter đã inject
            .addFilterBefore(corsFilter, ChannelProcessingFilter.class)
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
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
            .authorizeHttpRequests(auth -> auth
                // Preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Health check
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // Error
                .requestMatchers("/error").permitAll()

                // Auth
                .requestMatchers("/api/auth/**").permitAll()

                // Public GET
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/product-images/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/voucher/**").permitAll()

                // Payment
                .requestMatchers("/api/payment/**").permitAll()

                // Carts
                .requestMatchers("/api/carts/**").permitAll()

                // Chat
                .requestMatchers("/api/chat/**").permitAll()
                .requestMatchers("/api/chat/ask").permitAll()
                .requestMatchers("/api/chat/history/**").permitAll()
                .requestMatchers("/api/chat/session/**").permitAll()

                // Lucky Wheel
                .requestMatchers(HttpMethod.GET, "/api/prizes").permitAll()
                .requestMatchers("/api/lucky-wheel/spin").permitAll()
                .requestMatchers("/api/lucky-wheel/**").permitAll()

                // Test
                .requestMatchers("/api/test/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()

                // Authenticated
                .requestMatchers("/api/lucky-wheel/history").authenticated()
                .requestMatchers("/api/lucky-wheel/my-points").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/reviews/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/users/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/orders/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/admin/orders/**").hasRole("ADMIN")

                // Admin
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/chat-config/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/chat-faq/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/lucky-wheel/**").hasRole("ADMIN")

                // Default
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}