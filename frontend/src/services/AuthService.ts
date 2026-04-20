// src/services/AuthService.ts
import api from './api';
import { User } from '../types/model';

// Dữ liệu đăng ký (thường không cần ID vì server tự tạo)
interface RegisterData {
    email: string;
    username: string;
    password?: string;
}

// === ĐĂNG KÝ ===
export const registerUser = async (userData: RegisterData): Promise<User> => {
    // 1. Kiểm tra email trùng
    const exist = await api.get(`/users?email=${encodeURIComponent(userData.email)}`);
    
    if (exist.data.length > 0) {
        throw new Error("Email đã tồn tại!");
    }

    // 2. Tạo mới
    const response = await api.post('/users', userData);
    return response.data;
};

// === ĐĂNG NHẬP ===
export const loginUser = async (email: string, password: string): Promise<User> => {
    const response = await api.get(
        `/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    );

    if (response.data.length > 0) {
        return response.data[0];
    }
    throw new Error("Email hoặc mật khẩu không chính xác.");
};

// === QUÊN MẬT KHẨU ===
export const forgotPassword = async (email: string): Promise<boolean> => {
    // Giả lập delay
    await new Promise(res => setTimeout(res, 1000));
    console.log(`[Fake API] Gửi mail reset tới: ${email}`);
    return true;
};

// === CẬP NHẬT EMAIL ===
export const updateUserEmail = async (userId: number, email: string): Promise<User> => {
    // Kiểm tra email trùng của user khác
    const exist = await api.get(`/users?email=${encodeURIComponent(email)}`);
    const duplicated = exist.data.find((u: User) => u.id !== userId);
    if (duplicated) {
        throw new Error("Email đã được sử dụng bởi tài khoản khác.");
    }

    const response = await api.patch(`/users/${userId}`, { email });
    return response.data;
};

// === CẬP NHẬT MẬT KHẨU ===
export const updateUserPassword = async (userId: number, password: string): Promise<User> => {
    const response = await api.patch(`/users/${userId}`, { password });
    return response.data;
};