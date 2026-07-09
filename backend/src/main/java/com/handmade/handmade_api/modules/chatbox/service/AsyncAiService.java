package com.handmade.handmade_api.modules.chatbox.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

/**
 * Xử lý AI bất đồng bộ đúng chuẩn Spring @Async.
 *
 * Lý do tách riêng:
 *   - @Async chỉ hoạt động khi gọi qua Spring proxy (từ bean khác).
 *   - Nếu đặt @Async trong chính AiChatService rồi tự gọi (this.xxx()) → KHÔNG bất đồng bộ.
 *   - Tách ra AsyncAiService → AiChatService gọi qua Spring proxy → @Async hoạt động đúng.
 */
@Service
public class AsyncAiService {

    private static final Logger log = LoggerFactory.getLogger(AsyncAiService.class);

    @Autowired
    private AiChatService aiChatService;

    @Autowired
    private OllamaService ollamaService;

    /**
     * Gọi AI để sinh câu trả lời — KHÔNG chặn HTTP thread.
     * Trả về CompletableFuture<String> để caller await nếu cần.
     *
     * Được gọi bởi: ChatController khi xử lý tin nhắn chat.
     */
    @Async("aiExecutor")
    public CompletableFuture<String> generateAiResponseAsync(
            String userMsg,
            String context,
            List<com.handmade.handmade_api.modules.chatbox.entity.ChatMessage> history) {

        log.info("[AI-ASYNC] Bắt đầu xử lý: '{}' | thread: {}",
                userMsg.substring(0, Math.min(40, userMsg.length())),
                Thread.currentThread().getName());

        try {
            String response = aiChatService.generateResponse(userMsg, context, history);
            log.info("[AI-ASYNC] Hoàn thành | thread: {}", Thread.currentThread().getName());
            return CompletableFuture.completedFuture(response);
        } catch (Exception e) {
            log.error("[AI-ASYNC] Lỗi sinh response: {}", e.getMessage());
            return CompletableFuture.completedFuture(
                    "Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau.");
        }
    }

    /**
     * Stream AI response — chạy trên thread pool riêng, KHÔNG block HTTP thread.
     * Thay thế new Thread() thủ công trong AiChatService.generateStreamResponse().
     *
     * @param onNext     callback nhận từng chunk token
     * @param onComplete callback khi stream xong
     * @param onError    callback khi có lỗi
     */
    @Async("aiExecutor")
    public void streamAiResponseAsync(
            String userMsg,
            String context,
            List<com.handmade.handmade_api.modules.chatbox.entity.ChatMessage> history,
            Consumer<String> onNext,
            Runnable onComplete,
            Consumer<Throwable> onError) {

        log.info("[AI-STREAM-ASYNC] Stream bắt đầu | thread: {}", Thread.currentThread().getName());

        if (ollamaService.isEnabled()) {
            // Ollama hỗ trợ stream thật sự
            ollamaService.streamChat(userMsg, context, history, onNext, onComplete, onError);
        } else {
            // Groq không stream — generate đồng bộ rồi trả 1 lần (giả lập)
            try {
                String response = aiChatService.generateResponse(userMsg, context, history);
                onNext.accept(response);
                onComplete.run();
            } catch (Exception e) {
                log.error("[AI-STREAM-ASYNC] Lỗi: {}", e.getMessage());
                onError.accept(e);
            }
        }
    }
}
