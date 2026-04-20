import React from 'react';
import { useRegister } from '../hooks/useRegister'; // Đảm bảo bạn đã tạo file này trong thư mục hooks
import '../Styles/auth.css';

interface RegisterProps {
    onSwitchToLogin: () => void;
    onClose: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onClose }) => {
    // Lấy toàn bộ biến và hàm từ Hook ra
    const {
        email, setEmail,
        password, setPassword,
        username, setUsername,
        error, message,
        captchaCode, userCaptchaInput, setUserCaptchaInput, captchaColor,
        generateCaptcha,
        handleRegister
    } = useRegister();

    return (
        <div className="auth-container">
            {/* Giữ nguyên nút đóng và tiêu đề */}
            <button className="auth-close-button" onClick={onClose} aria-label="Close">
                &times; 
            </button>
            <h2>Đăng Ký Tài Khoản</h2>
            
            <form onSubmit={handleRegister} className="auth-form">
                {/* Các thông báo lỗi/thành công giữ nguyên class cũ */}
                {error && <p className="auth-error">{error}</p>}
                {message && <p className="auth-message">{message}</p>}

                <input 
                    type="text" 
                    placeholder="Tên người dùng" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    className="auth-input" 
                />
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
                    placeholder="Mật khẩu (ít nhất 6 ký tự)" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="auth-input" 
                />

                {/* Phần CAPTCHA - Giữ nguyên toàn bộ cấu trúc div và style inline của bạn */}
                <div className="captcha-section">
                    <label className="captcha-label">Mã xác nhận (Click vào mã để đổi):</label>
                    <div 
                        className="captcha-display" 
                        onClick={generateCaptcha}
                        style={{ color: captchaColor }}
                        title="Đổi mã khác"
                    >
                        {captchaCode}
                    </div>
                    <input 
                        type="text" 
                        placeholder="Nhập mã xác nhận" 
                        value={userCaptchaInput} 
                        onChange={(e) => setUserCaptchaInput(e.target.value)} 
                        required 
                        className="auth-input captcha-input" 
                    />
                </div>

                <button type="submit" className="auth-button">Đăng Ký</button>
            </form>

            <p className="auth-switch-text">
                Đã có tài khoản? <span onClick={onSwitchToLogin} className="auth-link">Đăng nhập</span>
            </p>
        </div>
    );
};

export default Register;