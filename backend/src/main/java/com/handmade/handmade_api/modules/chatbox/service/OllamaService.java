package com.handmade.handmade_api.modules.chatbox.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import org.springframework.scheduling.annotation.Async;
import java.util.*;

/**
 * Service gọi Ollama local (http://localhost:11434).
 *
 * Cách dùng:
 *  1. Cài Ollama: https://ollama.com/download/windows
 *  2. Tải model: ollama pull llama3.2:3b
 *  3. (Tùy chọn) Tạo custom model: ollama create handmade-bot -f Modelfile
 *  4. Bật trong application.properties: ollama.enabled=true
 */
@Service
public class OllamaService {

    private static final Logger logger = LoggerFactory.getLogger(OllamaService.class);

    @Value("${ollama.base-url:http://localhost:11434}")
    private String baseUrl;

    @Value("${ollama.model:llama3.2:3b}")
    private String model;

    @Value("${ollama.enabled:false}")
    private boolean enabled;

    @Value("${ollama.timeout-ms:15000}")
    private int timeoutMs;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Gửi tin nhắn đến Ollama và nhận phản hồi.
     *
     * @param userMessage Tin nhắn từ người dùng
     * @param systemContext Ngữ cảnh hệ thống (sản phẩm liên quan, chính sách, ...)
     * @return Phản hồi từ model, hoặc null nếu Ollama không khả dụng
     */
    @SuppressWarnings("unchecked")
    public String chat(String userMessage, String systemContext, List<com.handmade.handmade_api.modules.chatbox.entity.ChatMessage> history) {
        if (!enabled) return null;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("stream", false);

            List<Map<String, String>> messages = new ArrayList<>();

            // System prompt
            String systemPrompt = buildSystemPrompt(systemContext);
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // History messages
            if (history != null) {
                for (com.handmade.handmade_api.modules.chatbox.entity.ChatMessage msg : history) {
                    String role = msg.getSenderType().equals("USER") ? "user" : "assistant";
                    messages.add(Map.of("role", role, "content", msg.getContent()));
                }
            }

            // User message
            messages.add(Map.of("role", "user", "content", userMessage));
            body.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            String url = baseUrl + "/api/chat";

            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);

            if (response != null && response.containsKey("message")) {
                Map<String, Object> msg = (Map<String, Object>) response.get("message");
                String content = (String) msg.get("content");
                logger.info("Ollama response ({} chars) for: {}", 
                    content != null ? content.length() : 0, 
                    userMessage.substring(0, Math.min(50, userMessage.length())));
                return content;
            }

            logger.warn("Ollama trả về response không hợp lệ");
            return null;

        } catch (ResourceAccessException e) {
            // Ollama chưa được khởi động — fallback silently
            logger.debug("Ollama không khả dụng (chưa chạy): {}", e.getMessage());
            return null;
        } catch (Exception e) {
            logger.warn("Lỗi gọi Ollama: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Stream response từ Ollama — chạy bất đồng bộ trên "aiExecutor" thread pool.
     * @Async thay thế new Thread() thủ công cũ.
     */
    @Async("aiExecutor")
    public void streamChat(String userMessage, String systemContext,
            List<com.handmade.handmade_api.modules.chatbox.entity.ChatMessage> history,
            java.util.function.Consumer<String> onNext,
            Runnable onComplete,
            java.util.function.Consumer<Throwable> onError) {
        if (!enabled) {
            onError.accept(new RuntimeException("Ollama is not enabled"));
            return;
        }

        try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                Map<String, Object> body = new HashMap<>();
                body.put("model", model);
                body.put("stream", true);

                List<Map<String, String>> messages = new ArrayList<>();
                messages.add(Map.of("role", "system", "content", buildSystemPrompt(systemContext)));

                if (history != null) {
                    for (com.handmade.handmade_api.modules.chatbox.entity.ChatMessage msg : history) {
                        String role = msg.getSenderType().equals("USER") ? "user" : "assistant";
                        messages.add(Map.of("role", role, "content", msg.getContent()));
                    }
                }
                messages.add(Map.of("role", "user", "content", userMessage));
                body.put("messages", messages);

                org.springframework.web.client.RequestCallback requestCallback = restTemplate.httpEntityCallback(new HttpEntity<>(body, headers), Map.class);
                org.springframework.web.client.ResponseExtractor<Void> responseExtractor = response -> {
                    try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(response.getBody()))) {
                        String line;
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        while ((line = reader.readLine()) != null) {
                            if (line.trim().isEmpty()) continue;
                            try {
                                com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(line);
                                if (node.has("message") && node.get("message").has("content")) {
                                    String content = node.get("message").get("content").asText();
                                    if (content != null && !content.isEmpty()) {
                                        onNext.accept(content);
                                    }
                                }
                            } catch (Exception ex) {
                                logger.error("JSON parse error: " + line, ex);
                            }
                        }
                    }
                    onComplete.run();
                    return null;
                };

                restTemplate.execute(baseUrl + "/api/chat", HttpMethod.POST, requestCallback, responseExtractor);
            } catch (Exception e) {
                logger.error("Lỗi stream Ollama: ", e);
                onError.accept(e);
            }
    }

    /**
     * Kiểm tra Ollama có đang chạy không (health check).
     */
    public boolean isRunning() {
        if (!enabled) return false;
        try {
            restTemplate.getForObject(baseUrl + "/api/tags", String.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy danh sách model đã tải trong Ollama.
     */
    @SuppressWarnings("unchecked")
    public List<String> getAvailableModels() {
        try {
            Map<String, Object> response = restTemplate.getForObject(
                baseUrl + "/api/tags", Map.class);
            if (response != null && response.containsKey("models")) {
                List<Map<String, Object>> models = (List<Map<String, Object>>) response.get("models");
                return models.stream()
                    .map(m -> (String) m.get("name"))
                    .toList();
            }
        } catch (Exception e) {
            logger.debug("Không thể lấy danh sách model Ollama: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    private String buildSystemPrompt(String context) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là trợ lý ảo của HandMade Shop, chuyên bán đồ thủ công mỹ nghệ Việt Nam. ");
        sb.append("Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn (2-4 câu). ");
        sb.append("Dùng emoji phù hợp. Không bịa thông tin.\n");
        sb.append("QUAN TRỌNG: Nếu khách hàng hỏi xin link hoặc đòi xem sản phẩm, KHÔNG ĐƯỢC TỰ BỊA RA LINK HAY URL ẢNH. Thay vào đó, hãy nhắc lại ĐÚNG VÀ ĐẦY ĐỦ TÊN SẢN PHẨM mà bạn đang tư vấn để hệ thống tự động gắn link cho khách.\n\n");

        if (context != null && !context.isBlank()) {
            sb.append("THÔNG TIN THAM KHẢO:\n").append(context).append("\n");
        }

        return sb.toString();
    }
}
