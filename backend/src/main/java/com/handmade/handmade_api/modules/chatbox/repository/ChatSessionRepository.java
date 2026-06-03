// ChatSessionRepository.java
package com.handmade.handmade_api.modules.chatbox.repository;

import com.handmade.handmade_api.modules.chatbox.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findByUserIdAndStatus(Long userId, String status);
    Optional<ChatSession> findByAnonymousIdAndStatus(String anonymousId, String status);

    // Xóa các session anonymous cũ
    @Modifying
    @Query("DELETE FROM ChatSession s WHERE s.isAnonymous = true AND s.updatedAt < :time")
    void deleteOldAnonymousSessions(@Param("time") LocalDateTime time);
}