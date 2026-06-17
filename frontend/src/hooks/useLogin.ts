import { useState } from 'react';
import { loginUser } from '../services/AuthService';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/model';
import { useCart } from '../context/CartContext';

export const useLogin = (onLoginSuccess: (user: User) => void) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { mergeCart, refreshCart } = useCart();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            // 1. Gọi API Login
            const user: User = await loginUser(email, password);
            console.log("Dữ liệu gốc từ BE:", user);

            // 2. Lưu vào localStorage trước để các request sau có Token/Header ngay lập tức
            localStorage.setItem('user', JSON.stringify(user));

            // 3. Đồng bộ giỏ hàng (Quan trọng: phải đợi xong mới làm việc khác)
            if (user.id) {
                await mergeCart(user.id);
                await refreshCart();
            }

            // 4. Trích xuất quyền - Đảm bảo khớp với trường 'roles' trong AuthResponse.java
            const roles = user.roles || [];
            console.log("Quyền nhận được:", roles);

            // 5. Callback báo thành công (để cập nhật UI chung của App)
            onLoginSuccess(user);

            // 6. Điều hướng cuối cùng sau khi mọi thứ đã sẵn sàng
            if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) {
                navigate('/admin');
            } else {
                navigate('/');
            }

        } catch (err: any) {
            console.error("Login Error:", err);
            setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại.');
        }
    };

    return {
        email, setEmail,
        password, setPassword,
        error,
        handleSubmit
    };
};