package com.handmade.handmade_api.config;

import com.handmade.handmade_api.modules.vnpay.config.VnPayProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final AppProperties appProperties;
    private final VnPayProperties vnPayProperties;

    public HealthController(AppProperties appProperties, VnPayProperties vnPayProperties) {
        this.appProperties = appProperties;
        this.vnPayProperties = vnPayProperties;
    }

    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("frontendUrl", appProperties.getFrontendUrl());
        body.put("corsOrigins", appProperties.getCorsAllowedOrigins());
        body.put("vnpayConfigured", vnPayProperties.getTmnCode() != null
                && !vnPayProperties.getTmnCode().isBlank()
                && vnPayProperties.getHashSecret() != null
                && !vnPayProperties.getHashSecret().isBlank());
        body.put("vnpayReturnUrl", vnPayProperties.getReturnUrl());
        body.put("vnpayIpnUrl", vnPayProperties.getIpnUrl());
        return body;
    }
}
