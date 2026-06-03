package com.handmade.handmade_api.modules.chatbox.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.handmade.handmade_api.modules.adminchatbox.service.AiConfigService;
import com.handmade.handmade_api.modules.chatbox.entity.ChatFaq;
import com.handmade.handmade_api.modules.chatbox.repository.ChatFaqRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiChatService {

    private static final Logger logger = LoggerFactory.getLogger(AiChatService.class);

    @Autowired
    private AiConfigService configService;

    @Autowired
    private ChatFaqRepository faqRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @SuppressWarnings("unchecked")
    public String generateResponse(String userMsg, String context) {
        try {
            String apiKey = configService.getConfig("GROQ_API_KEY", "");

            if (apiKey.isEmpty()) {
                logger.warn("GROQ_API_KEY is not configured");
                return getFallbackResponse(userMsg);
            }

            String model = configService.getConfig("AI_MODEL", "llama-3.1-8b-instant");
            String systemPrompt = configService.getConfig("SYSTEM_PROMPT",
                    "Bạn là trợ lý ảo của HandMade Shop. Hãy trả lời lịch sự, chuyên nghiệp.");
            Double temperature = Double.parseDouble(
                    configService.getConfig("TEMPERATURE", "0.7")
            );
            String apiUrl = configService.getConfig("GROQ_API_URL",
                    "https://api.groq.com/openai/v1/chat/completions");

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String faqContext = buildFaqContext(userMsg);

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("temperature", temperature);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt + "\n\nThông tin tham khảo:\n" + faqContext + "\n\nNgữ cảnh: " + context);
            messages.add(systemMessage);

            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", userMsg);
            messages.add(userMessage);

            body.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);

            return extractContent(response);

        } catch (Exception e) {
            logger.error("Error calling Groq API: ", e);
            return getFallbackResponse(userMsg);
        }
    }

    private String getFallbackResponse(String userMsg) {
        try {
            List<ChatFaq> activeFaqs = faqRepo.findByIsActiveTrue();
            for (ChatFaq faq : activeFaqs) {
                String keywords = faq.getKeywords();
                if (keywords != null) {
                    String[] keywordArray = keywords.toLowerCase().split(",");
                    for (String keyword : keywordArray) {
                        if (userMsg.toLowerCase().contains(keyword.trim())) {
                            return faq.getResponseText();
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error in fallback response: ", e);
        }
        return "Cảm ơn bạn đã quan tâm! Vui lòng để lại số điện thoại, chúng tôi sẽ tư vấn cụ thể hơn ạ.";
    }

    private String buildFaqContext(String userMsg) {
        StringBuilder context = new StringBuilder();
        try {
            List<ChatFaq> activeFaqs = faqRepo.findByIsActiveTrue();
            for (ChatFaq faq : activeFaqs) {
                String keywords = faq.getKeywords();
                if (keywords != null) {
                    String[] keywordArray = keywords.toLowerCase().split(",");
                    for (String keyword : keywordArray) {
                        if (userMsg.toLowerCase().contains(keyword.trim())) {
                            context.append("- ").append(faq.getResponseText()).append("\n");
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error building FAQ context: ", e);
        }
        return context.toString();
    }

    private String extractContent(Map<String, Object> response) {
        try {
            String json = objectMapper.writeValueAsString(response);
            JsonNode root = objectMapper.readTree(json);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                return choices.get(0).path("message").path("content").asText();
            }
            return "Không thể lấy nội dung phản hồi từ AI.";
        } catch (Exception e) {
            logger.error("Error extracting content: ", e);
            return "Xin lỗi, không thể xử lý phản hồi từ AI!";
        }
    }

    public String getContextData(String userMsg) {
        StringBuilder context = new StringBuilder();

        String featuredProducts = configService.getConfig("FEATURED_PRODUCTS_CONTEXT", "");
        if (!featuredProducts.isEmpty()) {
            context.append("Sản phẩm nổi bật: ").append(featuredProducts).append("\n");
        }

        String shopPolicy = configService.getConfig("SHOP_POLICY", "");
        if (!shopPolicy.isEmpty()) {
            context.append("Chính sách: ").append(shopPolicy).append("\n");
        }

        String shopAddress = configService.getConfig("SHOP_ADDRESS", "");
        if (!shopAddress.isEmpty()) {
            context.append("Địa chỉ: ").append(shopAddress).append("\n");
        }

        return context.toString();
    }

    public void clearChatHistory(Long sessionId) {
        logger.info("Clearing chat history for session: {}", sessionId);
    }
}