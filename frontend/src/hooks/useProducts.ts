import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../services/ProductService';
import { Product } from '../types/model';
import api from '../services/api';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError]     = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProducts();
            // getProducts luôn trả về [] nếu lỗi → setProducts an toàn
            setProducts(data);
        } catch (err) {
            console.error('Lỗi tải sản phẩm:', err);
            setError('Không thể tải danh sách sản phẩm.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Cập nhật lượt xem
    const updateProductView = async (product: Product) => {
        try {
            const response = await api.patch(`/products/${product.id}`, {
                viewCount: (product.viewCount || 0) + 1,
            });
            if (!response?.data) return product;
            setProducts(prev => prev.map(p => p.id === product.id ? response.data : p));
            return response.data;
        } catch (err) {
            console.error('Lỗi cập nhật lượt xem:', err);
            throw err;
        }
    };

    // Giảm inventory sau mua
    const updateInventory = async (productId: number, newInventory: number) => {
        try {
            const response = await api.patch(`/products/${productId}`, {
                inventory: newInventory,
            });
            if (!response?.data) return;
            setProducts(prev => prev.map(p => p.id === productId ? response.data : p));
        } catch (err) {
            console.error('Lỗi cập nhật kho hàng:', err);
        }
    };

    return {
        products,
        loading,
        error,
        updateProductView,
        updateInventory,
        refreshProducts: fetchProducts,
    };
};

// ── Helpers ──
export const getTimeRemaining = (targetDate: Date) => {
    const total   = targetDate.getTime() - Date.now();
    const seconds = Math.max(Math.floor((total / 1000)          % 60), 0);
    const minutes = Math.max(Math.floor((total / 1000 / 60)     % 60), 0);
    const hours   = Math.max(Math.floor((total / 3_600_000)     % 24), 0);
    const days    = Math.max(Math.floor( total / 86_400_000),           0);
    return { total, days, hours, minutes, seconds };
};

export const calculateNewUserScore = (product: Product): number =>
    Math.max(0, 100 - (product.inventory || 0)) * 2;

export const calculateMemberScore = (product: Product): number =>
    (product.viewCount || 0) * 3 + (product.rating || 0) * 10;
