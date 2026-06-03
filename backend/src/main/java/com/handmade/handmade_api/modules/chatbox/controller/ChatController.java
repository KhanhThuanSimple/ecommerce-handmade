package com.handmade.handmade_api.modules.chatbox.controller;

import com.handmade.handmade_api.modules.chatbox.DTO.ChatRequest;
import com.handmade.handmade_api.modules.chatbox.DTO.ChatResponseDTO;
import com.handmade.handmade_api.modules.chatbox.entity.ChatSession;
import com.handmade.handmade_api.modules.chatbox.service.AiChatService;
import com.handmade.handmade_api.modules.chatbox.service.ChatService;
import com.handmade.handmade_api.modules.chatbox.util.UserIdProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private AiChatService aiChatService;

    @Autowired
    private UserIdProvider userIdProvider;

    @Value("${chat.allow-anonymous:true}")
    private boolean allowAnonymous;

    @PostMapping("/ask")
    public ResponseEntity<?> ask(
            @RequestBody ChatRequest request,
            HttpServletRequest httpRequest,
            Principal principal) {

        // Lấy userId (hỗ trợ cả authenticated và anonymous)
        Long userId = userIdProvider.getUserId(httpRequest, request);

        if (userId == null) {
            if (allowAnonymous) {
                // Tạo ID tạm cho anonymous
                userId = generateAnonymousUserId(httpRequest, request);
            } else {
                return ResponseEntity.status(401).body(Map.of(
                        "error", "Vui lòng đăng nhập để sử dụng chat!"
                ));
            }
        }

        // Lấy hoặc tạo session
        ChatSession session = chatService.getOrCreateSession(userId);

        // Lưu user message
        chatService.saveMessage(session.getId(), "USER", request.getMessage());

        // Lấy ngữ cảnh & Gọi AI
        String context = aiChatService.getContextData(request.getMessage());
        String botResponse = aiChatService.generateResponse(request.getMessage(), context);

        // Lưu bot message
        chatService.saveMessage(session.getId(), "BOT", botResponse);

        // FIX: Sử dụng HashMap thay vì Map.of để tránh NullPointerException
        Map<String, Object> response = new HashMap<>();
        response.put("reply", botResponse);
        response.put("sessionId", session.getId());
        response.put("isAnonymous", userId < 0 || isAnonymousUser(userId));

        // Chỉ thêm anonymousId nếu không null
        if (isAnonymousUser(userId)) {
            response.put("anonymousId", "ANON_" + userId);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<?> getHistory(@PathVariable Long sessionId, Principal principal) {
        // Kiểm tra quyền xem history
        var history = chatService.getChatHistory(sessionId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/session/close/{sessionId}")
    public ResponseEntity<?> closeSession(@PathVariable Long sessionId) {
        chatService.closeSession(sessionId);
        return ResponseEntity.ok(Map.of("message", "Session closed successfully"));
    }

    // Tạo userId cho anonymous user
    private Long generateAnonymousUserId(HttpServletRequest request, ChatRequest chatRequest) {
        String key = request.getRemoteAddr() + "_" + request.getHeader("User-Agent");
        if (chatRequest.getAnonymousId() != null && !chatRequest.getAnonymousId().isEmpty()) {
            key = chatRequest.getAnonymousId();
        }
        // Sử dụng số âm để phân biệt với user thật
        return (long) (Math.abs(key.hashCode()) % 1000000) * -1;
    }

    private boolean isAnonymousUser(Long userId) {
        return userId < 0;
    }
}