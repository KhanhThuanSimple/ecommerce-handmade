import { useState, useEffect } from 'react';
import { registerUser } from '../services/AuthService';

export const useRegister = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [captchaCode, setCaptchaCode] = useState('');
    const [userCaptchaInput, setUserCaptchaInput] = useState('');
    const [captchaColor, setCaptchaColor] = useState('#000');
            const [fullName, setFullName] = useState('');
        const [phone, setPhone] = useState('');

    const generateCaptcha = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        const randomColor = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
        setCaptchaCode(result);
        setCaptchaColor(randomColor);
        setUserCaptchaInput(''); 
    };

    useEffect(() => { generateCaptcha(); }, []);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Kiểm tra CAPTCHA
    if (userCaptchaInput !== captchaCode) {
        setError('Mã xác nhận không chính xác.');
        generateCaptcha();
        return;
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) { 
        setError('Mật khẩu phải có ít nhất 6 ký tự.'); 
        return; 
    }

    try {
        // GỬI ĐỦ 5 TRƯỜNG DỮ LIỆU SANG SERVICE
        await registerUser({ 
            email, 
            password, 
            username, 
            fullName, 
            phone 
        });

        setMessage('Đăng ký thành công!');
        
        // Reset toàn bộ form sau khi thành công
        setEmail(''); 
        setPassword(''); 
        setUsername('');
        setFullName(''); // Thêm dòng này
        setPhone('');    // Thêm dòng này
        generateCaptcha();
    } catch (err) {
        setError((err as Error).message || 'Lỗi đăng ký.');
        generateCaptcha();
    }
};

    return { email, setEmail, password, setPassword, username, setUsername,fullName, setFullName, phone, setPhone, error, message, captchaCode, userCaptchaInput, setUserCaptchaInput, captchaColor, generateCaptcha, handleRegister };
};