package com.handmade.handmade_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Cấu hình CORS tập trung bằng CorsFilter bean.
 * Chạy trước Spring Security filter chain, đảm bảo các lỗi 401, 403, 500 vẫn có CORS header.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // ✅ Cho phép các origins phù hợp với pattern để hỗ trợ dev và deploy Railway
        config.setAllowedOriginPatterns(List.of(
                "https://cheerful-rejoicing-production-8efa.up.railway.app",
                "http://localhost:3000",
                "http://localhost:[*]",
                "https://*.up.railway.app"
        ));

        // ✅ HTTP methods được phép
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // ✅ Cho phép tất cả headers
        config.setAllowedHeaders(List.of("*"));

        // ✅ Cho phép gửi credentials (cookie, Authorization header)
        config.setAllowCredentials(true);

        // ✅ Cache pre-flight 1 giờ
        config.setMaxAge(3600L);

        // ✅ Expose headers
        config.setExposedHeaders(List.of(
                "Authorization",
                "Content-Disposition",
                "X-Total-Count"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
