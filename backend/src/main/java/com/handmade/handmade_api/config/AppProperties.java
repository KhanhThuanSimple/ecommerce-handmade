package com.handmade.handmade_api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** URL giao diện React (dùng cho VNPay return, CORS) */
    private String frontendUrl = "http://localhost:3000";

    private List<String> corsAllowedOrigins = new ArrayList<>(List.of("http://localhost:3000"));

    private int serverPort = 8080;
}
