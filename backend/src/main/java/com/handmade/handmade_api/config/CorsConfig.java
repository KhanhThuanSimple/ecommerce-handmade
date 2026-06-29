package com.handmade.handmade_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cấu hình CORS tập trung — bean này được inject vào MySecurity.filterChain().
 * Không có bean này, Spring Boot sẽ fail khi khởi động (NoSuchBeanDefinitionException).
 */
@Configuration
public class CorsConfig {

    private final AppProperties appProperties;

    public CorsConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Cho phép các origins phù hợp với pattern để hỗ trợ dev và deploy Railway
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:[*]",
                "https://*.up.railway.app"
        ));

        // HTTP methods được phép
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers được phép — bao gồm Authorization và adminId header custom
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "adminId",
                "X-Requested-With",
                "Origin"
        ));

        // Cho phép gửi credentials (cookie, Authorization header)
        config.setAllowCredentials(true);

        // Pre-flight cache 30 phút
        config.setMaxAge(1800L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
