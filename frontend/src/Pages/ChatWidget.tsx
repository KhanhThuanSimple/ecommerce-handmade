// src/Pages/ChatWidget.tsx
import React, { useState } from "react";
import ChatBox from "./Chatbox";
import { User } from "../types/model";
import "../Styles/chatWidget.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface ChatWidgetProps {
  currentUser: User | null;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat button */}
      <div
        className="chat-float-btn"
        onClick={() => setOpen((prev) => !prev)}
        title="Chat với AI hỗ trợ"
      >
        <i className={`fa-regular ${open ? 'fa-times' : 'fa-message'}`}></i>
      </div>

      {/* Chat box */}
      {open && (
        <div className="chat-widget-container">
          <ChatBox currentUser={currentUser} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
};

export default ChatWidget;