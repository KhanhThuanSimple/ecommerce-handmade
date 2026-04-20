import { useState, useEffect } from 'react';
import { ChatService } from '../services/chatService';
import { AIService } from '../services/aiService';

export const useChat = (currentUser: any) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Nếu user logout hoặc chưa có id, reset mảng messages rỗng
        if (!currentUser?.id) {
            setMessages([]);
            return;
        }

        const initChat = async () => {
            // Bước 1: Gọi API lấy lịch sử đã lọc theo userId từ db.json
            const history = await ChatService.getHistory(currentUser.id);
            
            if (history.length === 0) {
                // Bước 2: Nếu là user mới hoàn toàn, tạo lời chào và lưu vào DB
                const welcome = await ChatService.saveMessage({
                    userId: currentUser.id,
                    content: `Chào ${currentUser.name || 'bạn'}! 👋 Shop HandMade có thể giúp gì cho Bạn?`,
                    sender: 'bot',
                    createdAt: new Date().toISOString()
                });
                setMessages([welcome]);
            } else {
                // Bước 3: Nếu có lịch sử, load lên UI. F5 sẽ luôn rơi vào đây.
                setMessages(history);
            }
        };

        initChat();
    }, [currentUser?.id]);
    // Đổi tên từ sendMessage thành onSend để khớp với file ChatBox.tsx
    const onSend = async (input: string) => {
        if (!input.trim() || !currentUser) return;

        const newMessage = await ChatService.saveMessage({
            userId: currentUser.id,
            content: input,
            sender: 'user',
            createdAt: new Date().toISOString()
        });
        setMessages(prev => [...prev, newMessage]);
        await ChatService.saveMessage(newMessage);
        setIsTyping(true);

        const dataForAI = await ChatService.findContextData(input);
        const aiResponse = await AIService.generateConsultantResponse(input, dataForAI);

        setTimeout(async () => {
            const botMsg = await ChatService.saveMessage({
                userId: currentUser.id,
                content: aiResponse,
                sender: 'bot',
                createdAt: new Date().toISOString()
            });
            setMessages(prev => [...prev, botMsg]);
            await ChatService.saveMessage(botMsg);
            setIsTyping(false);
        }, 800);
    };

    return { messages, isTyping, onSend };
};