    // src/services/api.ts
    import axios from 'axios';

    // Tạo một instance axios với cấu hình mặc định
    const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
        timeout: 10000, // Quá 10s thì báo lỗi
        headers: {
            'Content-Type': 'application/json',
        },
        
    });
    console.log(process.env.REACT_APP_API_URL);

    // (Tùy chọn) Interceptor để xử lý lỗi mạng chung
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.message === "Network Error") {
                console.error("Không kết nối được json-server!");
            }
            return Promise.reject(error);
        }
    );

    export default api;