import { useState } from 'react';
import { forgotPassword } from '../services/AuthService';

export const useForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            await forgotPassword(email);
            setMessage(`Yêu cầu đã được gửi. Vui lòng kiểm tra hộp thư của ${email}.`);
            setEmail('');
        } catch (err) {
            setError((err as Error).message || 'Đã xảy ra lỗi trong quá trình xử lý.');
        }
    };

    return {
        email,
        setEmail,
        error,
        message,
        handleSubmit
    };
};