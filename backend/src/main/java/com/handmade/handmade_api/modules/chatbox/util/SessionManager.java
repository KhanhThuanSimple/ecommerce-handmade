package com.handmade.handmade_api.modules.chatbox.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SessionManager {

    @Value("${chat.anonymous-session-timeout:30}")
    private int sessionTimeout;

    // Lưu trữ session ẩn danh (in-memory cache)
    private final Map<String, AnonymousUser> anonymousSessions = new ConcurrentHashMap<>();

    public AnonymousUser getOrCreateAnonymousSession(String anonymousId) {
        if (anonymousId != null && anonymousSessions.containsKey(anonymousId)) {
            AnonymousUser user = anonymousSessions.get(anonymousId);
            if (!user.isExpired(sessionTimeout)) {
                return user;
            }
            // Session hết hạn, xóa và tạo mới
            anonymousSessions.remove(anonymousId);
        }

        AnonymousUser newUser = new AnonymousUser();
        if (anonymousId != null) {
            newUser.setAnonymousId(anonymousId);
            newUser.setSessionId(anonymousId);
        }
        anonymousSessions.put(newUser.getAnonymousId(), newUser);
        return newUser;
    }

    public void removeAnonymousSession(String anonymousId) {
        anonymousSessions.remove(anonymousId);
    }

    public void cleanupExpiredSessions() {
        anonymousSessions.entrySet().removeIf(entry -> entry.getValue().isExpired(sessionTimeout));
    }
}