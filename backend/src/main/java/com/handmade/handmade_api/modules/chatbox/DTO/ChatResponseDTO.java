package com.handmade.handmade_api.modules.chatbox.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatResponseDTO {
    private String reply;
    private Long sessionId;
    private List<ChatMessageDTO> history;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ChatMessageDTO {
        private String senderType;
        private String content;
        private LocalDateTime timestamp;
    }
}