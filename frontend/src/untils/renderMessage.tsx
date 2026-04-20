import React from "react";
import '../Styles/chatbox.css';

export const renderMessageWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-link"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};
