import React from 'react';
import { User } from '../types/model';
import { useLogin } from '../hooks/useLogin'; // Import hook vừa tạo
import '../Styles/auth.css';

interface LoginProps {
    onLoginSuccess: (user: User) => void;
    onSwitchToRegister: () => void;
    onSwitchToForgot: () => void;
    onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ 
    onLoginSuccess, 
    onSwitchToRegister, 
    onSwitchToForgot, 
    onClose 
}) => {
    // Sử dụng logic từ Hook
    const {
        email,
        setEmail,
        password,
        setPassword,
        error,
        handleSubmit
    } = useLogin(onLoginSuccess);

    return (
        <div className="auth-container">
            {/* Nút đóng giữ nguyên */}
            <button className="auth-close-button" onClick={onClose}>
                &times; 
            </button>
            
            <h2>Đăng Nhập</h2>
            
            <form onSubmit={handleSubmit} className="auth-form">
                {error && <p className="auth-error">{error}</p>}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                />

                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="auth-input"
                />

                <button type="submit" className="auth-button">Đăng Nhập</button>
            </form>

            {/* Các link chuyển hướng giữ nguyên cấu trúc thẻ <a> */}
            <p className="auth-switch-text">
                <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToForgot(); }} className="auth-link">
                    Quên Mật khẩu?
                </a>
            </p>
            <p className="auth-switch-text">
                Chưa có tài khoản? 
                <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }} className="auth-link">
                    Đăng ký ngay
                </a>
            </p>
        </div>
    );
};

export default Login;