import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "../types/model";
import { useProducts } from "../hooks/useProducts";
import CartBadge from "./CartBadge";
import "../Styles/header.css";

interface HeaderProps {
    currentUser: User | null;
    onLogout: () => void;
}
const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return products
      .filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 6);
  }, [query, products]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/products?search=${query}`);
    setQuery("");
  };

  return (
    <header className="main-header">
      {/* LOGO */}
      <Link to="/home" className="logo">
        HandMade<span>Store</span>
      </Link>

      {/* SEARCH */}
      <div className="search-wrapper">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">
            <i className="fas fa-search"></i>
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="search-dropdown">
            {suggestions.map(item => (
              <div
                key={item.id}
                className="search-item"
                onClick={() => {
                  navigate(`/product/${item.id}`);
                  setQuery("");
                }}
              >
                <span>{item.name}</span>
                <span className="price">
                  {item.price.toLocaleString("vi-VN")}₫
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="nav-links">
        <Link to="/home">Trang chủ</Link>
        <Link to="/products">Sản phẩm</Link>
        <Link to="/about">Giới thiệu</Link>
        <CartBadge />
      </nav>

      {/* USER */}
      <div className="user-area">
        {currentUser ? (
          <>
            <Link to="/profile" className="user-info">
              <i className="fas fa-user-circle"></i>
              <span>{currentUser.username}</span>
            </Link>
            {/* <button className="logout-btn" onClick={onLogout}>
              Đăng xuất
            </button> */}
          </>
        ) : (
          <Link to="/login" className="login-btn">Đăng nhập</Link>
        )}
      </div>
    </header>
  );
};
export default Header;