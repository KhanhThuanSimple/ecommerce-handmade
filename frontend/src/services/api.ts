// src/services/api.ts
import axios from 'axios';

// 1. Tạo instance với URL của Spring Boot
const api = axios.create({
    // Nếu dùng .env thì giá trị phải là http://localhost:8080
    // Nếu chưa cấu hình .env, bạn có thể thay trực tiếp để test:
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Request Interceptor: Tự động đính kèm "vé thông hành" (Auth Header)
api.interceptors.request.use(
    (config) => {
        // Lấy token đã lưu từ localStorage sau khi login thành công
        const authHeader = localStorage.getItem('authHeader');
        
        if (authHeader) {
            config.headers.Authorization = authHeader;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Response Interceptor: Xử lý lỗi tập trung
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Lỗi từ phía Server (401, 403, 500...)
            if (error.response.status === 401) {
                console.error("Phiên đăng nhập hết hạn hoặc sai thông tin!");
                // Có thể redirect về trang login tại đây
                // localStorage.removeItem('authHeader');
                // window.location.href = '/login';
            } else if (error.response.status === 403) {
                console.error("Bạn không có quyền thực hiện hành động này!");
            }
        } else if (error.message === "Network Error") {
            console.error("Không thể kết nối đến Backend Spring Boot (Kiểm tra server đã chạy chưa)!");
        }
        return Promise.reject(error);
    }
);

export default api;