package com.handmade.handmade_api.modules.chatbox.DTO;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class ChatRequest {
    @NotBlank(message = "Message cannot be empty")
    private String message;

    private Long sessionId;
    private Long userId;

    // Thêm field cho anonymous chat
    private String anonymousId;
    private Boolean isAnonymous = false;
}