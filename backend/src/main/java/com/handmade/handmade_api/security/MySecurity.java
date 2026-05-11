package com.handmade.handmade_api.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.batch.BatchProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.sql.DataSource;
@Configuration
public class MySecurity {

    @Bean
    public JdbcUserDetailsManager jdbcUserDetailsManager(DataSource dataSource) {
        JdbcUserDetailsManager userDetailsManager = new JdbcUserDetailsManager(dataSource);

        // Sử dụng email làm định danh đăng nhập
        userDetailsManager.setUsersByUsernameQuery(
                "select email, password, enabled from users where email = ?"
        );

        // Truy vấn quyền dựa trên email
        userDetailsManager.setAuthoritiesByUsernameQuery(
                "select u.email, a.authority from authorities a " +
                        "join users u on a.username = u.username " +
                        "where u.email = ?"
        );
        return userDetailsManager;
    }
    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        // Vì DB bạn đang để '{noop}123456', dùng DelegatingPasswordEncoder là chuẩn nhất
        return org.springframework.security.crypto.factory.PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Thêm OPTIONS
                        .allowedHeaders("*") // Cho phép mọi Header (quan trọng cho Authorization)
                        .allowCredentials(true);
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults());
        http.csrf(csrf -> csrf.disable());

        http.authorizeHttpRequests(configure -> configure
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // THÊM DÒNG NÀY: Cho phép truy cập link login mà không cần đăng nhập trước
                .requestMatchers("/api/login").permitAll()

                .requestMatchers(HttpMethod.GET, "/products/**").hasAnyAuthority("ROLE_USER", "ROLE_TEACHER", "ROLE_ADMIN")
                // ... các cấu hình khác
                .anyRequest().authenticated()
        );

        http.httpBasic(Customizer.withDefaults());
        return http.build();
    }
}