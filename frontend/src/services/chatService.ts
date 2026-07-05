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
    mockContext?: string;
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

    // Gửi tin nhắn và nhận stream
    async sendStreamMessage(
        request: ChatRequest,
        onChunk: (text: string) => void,
        onDone: () => void,
        onError: (error: any) => void
    ): Promise<void> {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('http://localhost:8080/api/chat/ask/stream', {
                method: 'POST',
                headers,
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error('Network error');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                // Thay vì split('\n') có thể làm mất các ký tự \n thực sự của AI, ta tìm chữ 'data:'
                const parts = chunk.split('data:');
                
                for (let i = 1; i < parts.length; i++) {
                    let data = parts[i];
                    
                    // Loại bỏ \n\n ở cuối mỗi event của SSE
                    if (data.endsWith('\n\n')) {
                        data = data.substring(0, data.length - 2);
                    } else if (data.endsWith('\n')) {
                        data = data.substring(0, data.length - 1);
                    }

                    if (data.trim() === '[DONE]') {
                        onDone();
                        return;
                    }
                    
                    onChunk(data);
                }
            }
            onDone();
        } catch (err) {
            console.error('Stream error:', err);
            onError(err);
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