import React, { useState, useRef, useEffect } from 'react';
import { User } from "../types/model";
import { renderMessageWithLinks } from "../untils/renderMessage";
import { useChat } from "../hooks/useChat"; // Import hook vừa tách

import '../Styles/chatbox.css';
import '../Styles/chatWidget.css';

interface ChatboxProps {
    currentUser: User | null;
}

const ChatBox: React.FC<ChatboxProps> = ({ currentUser }) => {
    const [input, setInput] = useState<string>('');
    const { messages, isTyping, onSend } = useChat(currentUser); // Lấy data từ hook
    const scrollBottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = () => {
        onSend(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    if (!currentUser) return <div className="chatbox-error">Vui lòng đăng nhập để chat</div>;

    return (
        <div className="chatbox">
            <div className="chat-header">
                <div className="status-dot"></div>
                <div className="header-info">
                    <span>Hỗ trợ HandMade</span>
                    <small>AI Assistant đang trực tuyến</small>
                </div>
            </div>

            <div className="chat-body">
                {messages.map((m) => (
                    <div key={m.id || Math.random()} className={`chat-message ${m.sender === 'user' ? 'right' : 'left'}`}>
                        <div className="chat-bubble">
                            <div className="msg-text">{renderMessageWithLinks(m.content)}</div>
                            <span className="chat-time">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <div ref={scrollBottomRef} />
            </div>

            <div className="chat-input">
                <input
                    placeholder="Hỏi về sản phẩm..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleSend} disabled={!input.trim() || isTyping}>
                    Gửi
                </button>
            </div>
        </div>
    );
};

export default ChatBox;