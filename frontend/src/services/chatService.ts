// src/services/ChatService.ts
import api from './api';

export interface ChatMessage {
    id?: number;
    sessionId: number;
    senderType: 'USER' | 'BOT';
    content: string;
    createdAt?: string;
}

export interface ChatRequest {
    message: string;
    sessionId?: number;
    userId?: number;
    anonymousId?: string;
    isAnonymous?: boolean;
}

export interface ChatResponse {
    reply: string;
    sessionId: number;
    isAnonymous: boolean;
    anonymousId?: string;
}

export const ChatService = {
    // Gửi tin nhắn đến chatbot
    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        try {
            const res = await api.post('/chat/ask', request);
            return res.data;
        } catch (error: any) {
            console.error('Error sending message:', error);
            throw new Error(error.response?.data?.error || 'Không thể gửi tin nhắn');
        }
    },

    // Lấy lịch sử chat theo sessionId
    async getHistory(sessionId: number): Promise<ChatMessage[]> {
        try {
            const res = await api.get(`/chat/history/${sessionId}`);
            return res.data;
        } catch (error: any) {
            console.error('Error getting history:', error);
            return [];
        }
    },

    // Đóng session chat
    async closeSession(sessionId: number): Promise<void> {
        try {
            await api.post(`/chat/session/close/${sessionId}`);
        } catch (error: any) {
            console.error('Error closing session:', error);
        }
    },

    // Lưu anonymousId vào localStorage
    getAnonymousId(): string {
        let anonymousId = localStorage.getItem('anonymous_chat_id');
        if (!anonymousId) {
            anonymousId = 'ANON_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('anonymous_chat_id', anonymousId);
        }
        return anonymousId;
    },

    // Lấy userId từ token hoặc anonymous
    getUserId(currentUser: any): number | undefined {
        if (currentUser?.id) {
            return currentUser.id;
        }
        return undefined;
    }
};