package com.handmade.handmade_api.modules.chatbox.scheduler;

import com.handmade.handmade_api.modules.chatbox.repository.ChatSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class ChatCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(ChatCleanupScheduler.class);

    @Autowired
    private ChatSessionRepository sessionRepo;

    /**
     * Xóa session anonymous hết hạn — chạy mỗi giờ.
     *
     * @Async("taskExecutor") → chạy trên thread pool riêng, không block Scheduler thread.
     * Nếu cleanup tốn 5 phút, scheduler vẫn có thể kích hoạt tác vụ khác.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Async("taskExecutor")
    @Transactional
    public void cleanupOldAnonymousSessions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
        log.info("[CLEANUP-ASYNC] Bắt đầu xóa session cũ hơn 24h | thread: {}",
                Thread.currentThread().getName());
        sessionRepo.deleteOldAnonymousSessions(cutoffTime);
        log.info("[CLEANUP-ASYNC] Hoàn thành");
    }
}