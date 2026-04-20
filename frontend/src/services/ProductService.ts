// src/services/ProductService.ts
import api from './api';
import { Product, Review } from '../types/model';

// 1. Lấy tất cả sản phẩm
export const getProducts = async (): Promise<Product[]> => {
    try {
        const response = await api.get('/products');
        return response.data;
    } catch (error) {
        console.error("Lỗi fetch products:", error);
        return [];
    }
};

// 2. Lấy sản phẩm theo ID
export const getProductById = async (id: number): Promise<Product | null> => {
    try {
        const response = await api.get(`/products/${id}`);
        return response.data;
    } catch (error) {
        return null;
    }
};


export const getReviewsByProductId = async (productId: number): Promise<Review[]> => {
    try {
        const response = await api.get(`/reviews?productId=${productId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi fetch reviews:", error);
        return [];
    }
};

// 5. Gửi review mới lên server (Lưu trực tiếp vào json)
export const postReview = async (newReview: Omit<Review, 'id'>): Promise<Review | null> => {
    try {
        const response = await api.post('/reviews', newReview);
        return response.data;
    } catch (error) {
        console.error("Lỗi gửi review:", error);
        return null;
    }
    
};