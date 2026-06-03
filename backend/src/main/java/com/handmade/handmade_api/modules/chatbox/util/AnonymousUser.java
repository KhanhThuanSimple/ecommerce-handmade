package com.handmade.handmade_api.modules.chatbox.util;

import java.util.UUID;

public class AnonymousUser {
    private String anonymousId;
    private String sessionId;
    private long createdAt;

    public AnonymousUser() {
        this.anonymousId = "ANON_" + UUID.randomUUID().toString().substring(0, 8);
        this.sessionId = this.anonymousId;
        this.createdAt = System.currentTimeMillis();
    }

    public AnonymousUser(String anonymousId) {
        this.anonymousId = anonymousId;
        this.sessionId = anonymousId;
        this.createdAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public String getAnonymousId() { return anonymousId; }
    public void setAnonymousId(String anonymousId) { this.anonymousId = anonymousId; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public boolean isExpired(int timeoutMinutes) {
        return System.currentTimeMillis() - createdAt > timeoutMinutes * 60 * 1000L;
    }
}