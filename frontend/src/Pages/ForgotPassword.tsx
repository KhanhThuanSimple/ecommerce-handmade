import React from 'react';
import { useForgotPassword } from '../hooks/useForgotPassword';
import '../Styles/auth.css'; 

interface ForgotPasswordProps {
    onSwitchToLogin: () => void;
    onClose: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin, onClose }) => {
    // Gọi logic từ Hook
    const { 
        email, 
        setEmail, 
        error, 
        message, 
        handleSubmit 
    } = useForgotPassword();

    return (
        <div className="auth-container">
            <button className="auth-close-button" onClick={onClose}>
                &times; 
            </button>
            <h2>Quên Mật khẩu</h2>
            <p>Vui lòng nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
            
            <form onSubmit={handleSubmit} className="auth-form">
                {error && <p className="auth-error">{error}</p>}
                {message && <p className="auth-message">{message}</p>}
                
                <input 
                    type="email" 
                    placeholder="Email của bạn" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="auth-input" 
                />

                <button type="submit" className="auth-button">Gửi Yêu Cầu</button>
            </form>

            <p className="auth-switch-text">
                <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }} className="auth-link">
                    Quay lại Đăng nhập
                </a>
            </p>
        </div>
    );
};

export default ForgotPassword;