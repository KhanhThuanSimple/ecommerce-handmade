import { useState } from 'react';
import { loginUser } from '../services/AuthService';
import { User } from '../types/model';
import { useCart } from '../context/CartContext';

export const useLogin = (onLoginSuccess: (user: User) => void) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { mergeCart, refreshCart } = useCart();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            const user: User = await loginUser(email, password);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Xử lý giỏ hàng đồng bộ với user mới
            await mergeCart(user.id);
            await refreshCart();
            
            onLoginSuccess(user);
        } catch (err) {
            setError((err as Error).message || 'Đăng nhập không thành công.');
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        handleSubmit
    };
};