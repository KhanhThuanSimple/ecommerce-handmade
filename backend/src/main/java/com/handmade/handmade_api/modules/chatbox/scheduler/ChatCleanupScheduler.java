package com.handmade.handmade_api.modules.chatbox.scheduler;

import com.handmade.handmade_api.modules.chatbox.repository.ChatSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class ChatCleanupScheduler {

    @Autowired
    private ChatSessionRepository sessionRepo;

    // Chạy mỗi giờ, xóa session anonymous cũ hơn 24 giờ
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupOldAnonymousSessions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
        sessionRepo.deleteOldAnonymousSessions(cutoffTime);
    }
}