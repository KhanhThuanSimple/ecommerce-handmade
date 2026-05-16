import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
    (config) => {

        const authHeader = localStorage.getItem('authHeader');

        // Không gửi Authorization cho login/register
        const isAuthEndpoint =
            config.url?.includes('/auth/login') ||
            config.url?.includes('/auth/register');

        if (authHeader && !isAuthEndpoint) {
            config.headers.Authorization = authHeader;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;