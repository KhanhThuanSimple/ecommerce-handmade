// src/services/aiService.ts
// Service này chỉ để gọi backend API, KHÔNG gọi trực tiếp Groq

import { ChatService } from './chatService';

export const AIService = {
    // Gửi câu hỏi và nhận phản hồi từ AI (qua backend)
    async askQuestion(message: string, userId?: number, sessionId?: number): Promise<string> {
        try {
            const request = {
                message: message,
                userId: userId,
                sessionId: sessionId,
                isAnonymous: !userId,
                anonymousId: !userId ? ChatService.getAnonymousId() : undefined
            };
            
            const response = await ChatService.sendMessage(request);
            return response.reply;
        } catch (error) {
            console.error('AI Service error:', error);
            return "Xin lỗi, hiện tại tôi đang gặp sự cố. Vui lòng thử lại sau!";
        }
    }
};