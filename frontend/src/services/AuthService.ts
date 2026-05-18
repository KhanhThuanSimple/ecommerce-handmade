// src/services/AuthService.ts
import api from './api';
import { User } from '../types/model';

// Định nghĩa dữ liệu đăng ký khớp với DB
interface RegisterData {
    email: string;
    username: string;
    password?: string;
    fullName?: string;
    phone?: string;
}

// === 1. ĐĂNG KÝ (Kết nối Spring Boot) ===
export const registerUser = async (userData: RegisterData): Promise<User> => {
    // Thay vì check email ở FE, ta gửi thẳng cho BE xử lý (vì BE quản lý DB)
    const response = await api.post('/auth/register', userData); 
    return response.data;
};

// === 2. ĐĂNG NHẬP (Kết nối AuthController.java) ===
// === 2. ĐĂNG NHẬP ===
export const loginUser = async (email: string, password: string): Promise<any> => {
    const response = await api.post('/auth/login', 
        { email, password }, 
        { headers: { Authorization: '' } } 
    );

    if (response.status === 200) {
        const user = response.data;
        const authHeader = 'Basic ' + btoa(`${email}:${password}`);
        
        // Lưu thông tin quan trọng
        localStorage.setItem('authHeader', authHeader);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('user', JSON.stringify(user)); // Lưu object để lấy ID và Role
        
        return user;
    }
    throw new Error("Đăng nhập thất bại");
};
// === 3. ĐĂNG XUẤT ===
export const logoutUser = () => {
    localStorage.removeItem('authHeader');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
};

// === 4. QUÊN MẬT KHẨU (Sửa lỗi ở useForgotPassword.ts) ===
export const forgotPassword = async (email: string): Promise<boolean> => {
    // Gọi API quên mật khẩu ở BE (nếu chưa có BE thì để tạm fake như bên dưới)
    console.log(`[Request] Gửi mail reset tới: ${email}`);
    await new Promise(res => setTimeout(res, 800)); // Giả lập delay
    return true; 
};

// === 5. CẬP NHẬT EMAIL (Sửa lỗi ở useProfile.ts) ===
export const updateUserEmail = async (userId: number, email: string): Promise<User> => {
    const response = await api.patch(`/users/${userId}/email`, { email });
    return response.data;
};

// === 6. CẬP NHẬT MẬT KHẨU (Sửa lỗi ở useProfile.ts) ===
export const updateUserPassword = async (userId: number, password: string): Promise<User> => {
    const response = await api.patch(`/users/${userId}/password`, { password });
    return response.data;
};