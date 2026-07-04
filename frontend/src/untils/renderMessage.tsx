import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../types/model";
import '../Styles/chatbox.css';

export const renderMessageWithLinks = (text: string, products: Product[] = []) => {
  if (!text) return null;

  // Lọc tên dài hơn 3 ký tự và sắp xếp theo độ dài giảm dần để match chính xác nhất
  const sortedProducts = [...products]
    .filter(p => p.name && p.name.length > 3)
    .sort((a, b) => b.name.length - a.name.length);

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlParts = text.split(urlRegex);

  return urlParts.map((urlPart, i) => {
    // 1. Nếu là URL bình thường
    if (urlPart.match(urlRegex)) {
      return (
        <a key={`url-${i}`} href={urlPart} target="_blank" rel="noopener noreferrer" className="chat-link">
          {urlPart}
        </a>
      );
    }

    // 2. Nếu không có sản phẩm nào, trả về text thường
    if (sortedProducts.length === 0) {
      return <span key={`text-${i}`}>{urlPart}</span>;
    }

    // 3. Quét tên sản phẩm trong đoạn text
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const productNamesPattern = sortedProducts.map(p => escapeRegex(p.name)).join('|');
    const productRegex = new RegExp(`(${productNamesPattern})`, 'gi');

    const textParts = urlPart.split(productRegex);

    return (
      <span key={`text-${i}`}>
        {textParts.map((tPart, j) => {
          const matchedProduct = sortedProducts.find(
            p => p.name.toLowerCase() === tPart.toLowerCase()
          );

          if (matchedProduct) {
            return (
              <Link 
                key={`prod-${i}-${j}`} 
                to={`/product/${matchedProduct.id}`}
                className="chat-product-link"
                title="Click để đặt hàng ngay"
              >
                {tPart}
              </Link>
            );
          }
          return <span key={`span-${i}-${j}`}>{tPart}</span>;
        })}
      </span>
    );
  });
};

export const formatChatTime = (timestamp?: string | Date): string => {
  if (!timestamp) return '';
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins}m`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
};
