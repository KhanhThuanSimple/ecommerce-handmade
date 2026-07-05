// src/hooks/useChat.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatService, ChatMessage } from '../services/chatService';
import { AIService } from '../services/aiService';

interface UseChatProps {
    currentUser: any;
    sessionId?: number;
    products?: any[];
}

export const useChat = ({ currentUser, sessionId: externalSessionId, products = [] }: UseChatProps) => {
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
            const userId = currentUser?.id;
            
            // Khởi tạo một message bot trống
            const initialBotMessage: ChatMessage = {
                sessionId: currentSessionId || 0,
                senderType: 'BOT',
                content: '',
                createdAt: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, initialBotMessage]);
            setIsTyping(true); // Vẫn hiện typing mờ mờ ở dưới
            
            let accumulatedReply = '';
            
            const mockContextString = products.length > 0 
                ? "THÔNG TIN SẢN PHẨM HIỆN CÓ: " + products.map(p => `${p.name} (Giá: ${p.price}đ)`).join(', ') 
                : undefined;

            await ChatService.sendStreamMessage(
                {
                    message: content,
                    userId: userId,
                    sessionId: currentSessionId || undefined,
                    isAnonymous: !userId,
                    anonymousId: !userId ? ChatService.getAnonymousId() : undefined,
                    mockContext: mockContextString
                },
                (chunk) => {
                    // Xóa typing khi bắt đầu nhận cục đầu tiên
                    setIsTyping(false);
                    accumulatedReply += chunk;
                    
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1].content = accumulatedReply;
                        return newMsgs;
                    });
                },
                () => {
                    setIsTyping(false);
                },
                (error) => {
                    setIsTyping(false);
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1].content = 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau!';
                        return newMsgs;
                    });
                }
            );

        } catch (error) {
            console.error('Send message error:', error);
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