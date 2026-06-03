package com.handmade.handmade_api.modules.chatbox.service;

import com.handmade.handmade_api.modules.chatbox.entity.ChatMessage;
import com.handmade.handmade_api.modules.chatbox.entity.ChatSession;
import com.handmade.handmade_api.modules.chatbox.repository.ChatMessageRepository;
import com.handmade.handmade_api.modules.chatbox.repository.ChatSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ChatService {

    @Autowired
    private ChatSessionRepository sessionRepo;

    @Autowired
    private ChatMessageRepository messageRepo;

    @Transactional
    public ChatSession getOrCreateSession(Long userId) {
        return sessionRepo.findByUserIdAndStatus(userId, "ACTIVE")
                .orElseGet(() -> {
                    ChatSession session = new ChatSession();
                    session.setUserId(userId);
                    session.setStatus("ACTIVE");
                    return sessionRepo.save(session);
                });
    }

    // Thêm phương thức mới hỗ trợ anonymous
    @Transactional
    public ChatSession getOrCreateSession(Long userId, String anonymousId, String ipAddress) {
        Optional<ChatSession> existingSession;

        if (userId != null && userId > 0) {
            // User đã đăng nhập
            existingSession = sessionRepo.findByUserIdAndStatus(userId, "ACTIVE");
        } else {
            // User ẩn danh - tìm theo anonymousId
            existingSession = sessionRepo.findByAnonymousIdAndStatus(anonymousId, "ACTIVE");
        }

        return existingSession.orElseGet(() -> {
            ChatSession session = new ChatSession();
            session.setUserId(userId != null && userId > 0 ? userId : -1L);
            session.setStatus("ACTIVE");
            session.setIsAnonymous(userId == null || userId <= 0);
            session.setAnonymousId(anonymousId);
            return sessionRepo.save(session);
        });
    }

    @Transactional
    public ChatMessage saveMessage(Long sessionId, String senderType, String content) {
        ChatMessage message = new ChatMessage();
        message.setSessionId(sessionId);
        message.setSenderType(senderType);
        message.setContent(content);
        return messageRepo.save(message);
    }

    public List<ChatMessage> getChatHistory(Long sessionId) {
        return messageRepo.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Transactional
    public void closeSession(Long sessionId) {
        sessionRepo.findById(sessionId).ifPresent(session -> {
            session.setStatus("CLOSED");
            sessionRepo.save(session);
        });
    }
}