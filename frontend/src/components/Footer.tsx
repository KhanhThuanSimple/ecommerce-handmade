// src/components/Footer.tsx
import React from "react";
import "../Styles/Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-brand">
          <h2 className="footer-logo">Handmade<span>Shop</span></h2>
          <p className="footer-desc">
            Mang đến những sản phẩm thủ công tinh tế, được tạo nên từ sự tỉ mỉ
            và tâm huyết của nghệ nhân Việt.
          </p>
        </div>

        {/* LINKS */}
        <div className="footer-section">
          <h3>Danh mục</h3>
          <ul>
            <li><a href="/">Trang chủ</a></li>
            <li><a href="/products">Sản phẩm</a></li>
            <li><a href="/about">Giới thiệu</a></li>
            <li><a href="/contact">Liên hệ</a></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div className="footer-section">
          <h3>Hỗ trợ</h3>
          <ul>
            <li><a href="#">Chính sách đổi trả</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Hướng dẫn mua hàng</a></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="footer-section">
          <h3>Liên hệ</h3>
          <p>Email: support@handmadeshop.com</p>
          <p>Hotline: 0123 456 789</p>
          <p>Địa chỉ: TP. Hồ Chí Minh</p>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Handmade Shop. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
