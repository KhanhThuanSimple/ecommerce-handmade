package com.handmade.handmade_api.modules.chatbox.util;

import com.handmade.handmade_api.modules.chatbox.DTO.ChatRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class UserIdProvider {

    @Value("${chat.allow-anonymous:true}")
    private boolean allowAnonymous;

    public Long getUserId(HttpServletRequest request, ChatRequest chatRequest) {
        // 1. Ưu tiên userId từ request body
        if (chatRequest.getUserId() != null && chatRequest.getUserId() > 0) {
            return chatRequest.getUserId();
        }

        // 2. Lấy từ authentication (user đã đăng nhập)
        if (request.getUserPrincipal() != null) {
            // TODO: Lấy userId từ principal
            return extractUserIdFromPrincipal(request.getUserPrincipal());
        }

        // 3. Chat ẩn danh
        if (allowAnonymous) {
            return getAnonymousUserId(request, chatRequest);
        }

        return null;
    }

    private Long extractUserIdFromPrincipal(java.security.Principal principal) {
        // TODO: Implement logic lấy userId từ principal
        // Tạm thời return null để test
        return null;
    }

    private Long getAnonymousUserId(HttpServletRequest request, ChatRequest chatRequest) {
        // Tạo ID ẩn danh từ session ID hoặc IP + User-Agent
        String anonymousKey = getAnonymousKey(request, chatRequest);
        // Hash thành Long (tạm thời dùng hash code, cần cải thiện)
        return (long) anonymousKey.hashCode() & 0x7fffffff;
    }

    private String getAnonymousKey(HttpServletRequest request, ChatRequest chatRequest) {
        if (chatRequest.getSessionId() != null) {
            return "ANON_" + chatRequest.getSessionId();
        }

        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        return "ANON_" + ip + "_" + (userAgent != null ? userAgent.hashCode() : "");
    }
}