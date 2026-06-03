// src/hooks/useChat.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatService, ChatMessage } from '../services/chatService';
import { AIService } from '../services/aiService';

interface UseChatProps {
    currentUser: any;
    sessionId?: number;
}

export const useChat = ({ currentUser, sessionId: externalSessionId }: UseChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(externalSessionId || null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load lịch sử chat khi có sessionId
    useEffect(() => {
        if (currentSessionId) {
            loadHistory(currentSessionId);
        }
    }, [currentSessionId]);

    const loadHistory = async (sessionId: number) => {
        try {
            const history = await ChatService.getHistory(sessionId);
            setMessages(history);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const onSend = useCallback(async (content: string) => {
        if (!content.trim()) return;

        // Thêm message tạm thời của user
        const tempUserMessage: ChatMessage = {
            sessionId: currentSessionId || 0,
            senderType: 'USER',
            content: content,
            createdAt: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, tempUserMessage]);
        setIsTyping(true);

        try {
            // Gửi request đến backend
            const userId = currentUser?.id;
            
            const response = await ChatService.sendMessage({
                message: content,
                userId: userId,
                sessionId: currentSessionId || undefined,
                isAnonymous: !userId,
                anonymousId: !userId ? ChatService.getAnonymousId() : undefined
            });
            
            // Lưu sessionId từ response
            if (response.sessionId && !currentSessionId) {
                setCurrentSessionId(response.sessionId);
            }
            
            // Thêm bot message
            const botMessage: ChatMessage = {
                sessionId: response.sessionId,
                senderType: 'BOT',
                content: response.reply,
                createdAt: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, botMessage]);
            
        } catch (error) {
            console.error('Send message error:', error);
            // Thêm message lỗi
            const errorMessage: ChatMessage = {
                sessionId: currentSessionId || 0,
                senderType: 'BOT',
                content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau!',
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    }, [currentSessionId, currentUser]);

    const clearHistory = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        isTyping,
        sessionId: currentSessionId,
        onSend,
        clearHistory,
        messagesEndRef
    };
};