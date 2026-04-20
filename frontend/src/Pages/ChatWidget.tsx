import React, { useState } from "react";
import ChatBox from "./Chatbox";
import { User } from "../types/model";
import "../Styles/chatWidget.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import '../Styles/chatWidget.css';
import '../Styles/chatbox.css';

interface ChatWidgetProps {
  currentUser: User | null;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 🔵 Bông bóng chat */}
      <div
        className="chat-float-btn"
        onClick={() => setOpen((prev) => !prev)}
        title="Chat với AI hỗ trợ"
      >

        <span className="chat-pulse">
          <i className="fa-regular fa-message"></i>
        </span>

        💬
        <span className="chat-pulse"></span>
      </div>

      {/* 🟢 Hộp chat */}
      {open && (
        <div className="chat-widget-container">
          <ChatBox currentUser={currentUser} />
        </div>
      )}
    </>
  );
};

export default ChatWidget;

