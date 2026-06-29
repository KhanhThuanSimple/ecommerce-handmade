package com.handmade.handmade_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AppProperties appProperties;

    public WebSocketConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        java.util.List<String> allowed = new java.util.ArrayList<>(appProperties.getCorsAllowedOrigins());
        if (!allowed.contains("http://localhost:3000")) {
            allowed.add("http://localhost:3000");
        }
        if (!allowed.contains("https://cheerful-rejoicing-production-8efa.up.railway.app")) {
            allowed.add("https://cheerful-rejoicing-production-8efa.up.railway.app");
        }
        String[] origins = allowed.toArray(new String[0]);
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins)
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic"); // Kênh nhận dữ liệu từ BE
        registry.setApplicationDestinationPrefixes("/app");
    }
}