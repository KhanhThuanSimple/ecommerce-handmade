package com.handmade.handmade_api.modules.chatbox.repository;

import com.handmade.handmade_api.modules.chatbox.entity.ChatFaq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatFaqRepository extends JpaRepository<ChatFaq, Long> {
    List<ChatFaq> findByIsActiveTrue();
}