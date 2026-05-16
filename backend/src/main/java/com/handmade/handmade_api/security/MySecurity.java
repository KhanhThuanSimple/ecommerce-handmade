package com.handmade.handmade_api.security;

import com.handmade.handmade_api.modules.auth.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
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

    // =========================
    // CORS CONFIG
    // =========================
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {

                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000") // Đã chỉ định cụ thể ở đây
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

    // =========================
    // USER DETAILS
    // =========================
    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {

        return email -> userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with email: " + email));
    }

    // =========================
    // SECURITY FILTER
    // =========================
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())

                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        // =========================
                        // PUBLIC API
                        // =========================

                        .requestMatchers("/api/auth/**").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/api/products/**").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/api/categories/**").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/api/product-images/**").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/api/reviews/**").permitAll()

                        // =========================
                        // USER API
                        // =========================

                        .requestMatchers("/api/users/**")
                        .hasAnyRole("USER", "ADMIN")

                        .requestMatchers(HttpMethod.POST,
                                "/api/reviews/**")
                        .hasAnyRole("USER", "ADMIN")

                        // =========================
                        // ADMIN API
                        // =========================

                        .requestMatchers(HttpMethod.POST,
                                "/api/products/**")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/products/**")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/products/**")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST,
                                "/api/categories/**")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/categories/**")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/categories/**")
                        .hasRole("ADMIN")

                        // =========================
                        // OTHER REQUEST
                        // =========================

                        .anyRequest().authenticated()
                )

                // Basic Auth
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}