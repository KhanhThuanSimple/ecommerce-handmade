// src/Pages/ChatBox.tsx
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types/model';
import { renderMessageWithLinks, formatChatTime } from '../utils/renderMessage';
import { useChat } from '../hooks/useChat';
import '../Styles/chatbox.css';
import '../Styles/chatWidget.css';

interface ChatboxProps {
    currentUser: User | null;
    onClose?: () => void;
}

const ChatBox: React.FC<ChatboxProps> = ({ currentUser, onClose }) => {
    const [input, setInput] = useState<string>('');
    const { messages, isTyping, onSend } = useChat({ currentUser });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = () => {
        if (input.trim() && !isTyping) {
            onSend(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chatbox">
            <div className="chat-header">
                <div className="status-dot"></div>
                <div className="header-info">
                    <span>Hỗ trợ HandMade</span>
                    <small>AI Assistant đang trực tuyến</small>
                </div>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>×</button>
                )}
            </div>

            <div className="chat-body">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <i className="fa-regular fa-comment-dots"></i>
                        <p>Chào bạn! Tôi là trợ lý ảo của HandMade Shop.</p>
                        <p>Tôi có thể tư vấn về sản phẩm, giá cả, chính sách...</p>
                        <p>Bạn cần tôi giúp gì ạ?</p>
                    </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div 
                        key={msg.id || idx} 
                        className={`chat-message ${msg.senderType === 'USER' ? 'right' : 'left'}`}
                    >
                        <div className="chat-bubble">
                            <div className="msg-text">
                                {renderMessageWithLinks(msg.content)}
                            </div>
                            <span className="chat-time">
                                {formatChatTime(msg.createdAt)}
                            </span>
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="chat-message left">
                        <div className="chat-bubble typing">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Hỏi về sản phẩm..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isTyping}
                />
                <button 
                    onClick={handleSend} 
                    disabled={!input.trim() || isTyping}
                >
                    {isTyping ? '...' : 'Gửi'}
                </button>
            </div>
        </div>
    );
};

export default ChatBox;