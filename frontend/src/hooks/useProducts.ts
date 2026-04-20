import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../services/ProductService';
import { Product } from '../types/model';
import api from '../services/api';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Hàm tải dữ liệu (Dùng useCallback để tránh tạo lại hàm vô ích)
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            console.error("Lỗi tải sản phẩm:", err);
            setError("Không thể tải danh sách sản phẩm.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // 2. Hàm cập nhật lượt xem VÀ cập nhật UI ngay lập tức
    const updateProductView = async (product: Product) => {
        try {
            const response = await api.patch(`/products/${product.id}`, {
                viewCount: (product.viewCount || 0) + 1 
            });

            // CẬP NHẬT STATE CỤC BỘ ĐỂ RENDER LẠI UI
            setProducts(prevProducts => 
                prevProducts.map(p => p.id === product.id ? response.data : p)
            );

            return response.data; 
        } catch (error) {
            console.error("Lỗi cập nhật lượt xem:", error);
            throw error; 
        }
    };

    // 3. Hàm giả lập mua hàng (Giảm inventory)
    const updateInventory = async (productId: number, newInventory: number) => {
        try {
            const response = await api.patch(`/products/${productId}`, {
                inventory: newInventory
            });

            // Cập nhật state để Home render lại danh sách theo inventory mới
            setProducts(prevProducts => 
                prevProducts.map(p => p.id === productId ? response.data : p)
            );
        } catch (error) {
            console.error("Lỗi cập nhật kho hàng:", error);
        }
    };

    return { 
        products, 
        loading, 
        error, 
        updateProductView, 
        updateInventory, 
        refreshProducts: fetchProducts 
    };
};

// --- CÁC HÀM HELPER GIỮ NGUYÊN ---
export const getTimeRemaining = (targetDate: Date) => {
    const total = targetDate.getTime() - new Date().getTime();
    const seconds = Math.max(Math.floor((total / 1000) % 60), 0);
    const minutes = Math.max(Math.floor((total / 1000 / 60) % 60), 0);
    const hours = Math.max(Math.floor((total / (1000 * 60 * 60)) % 24), 0);
    const days = Math.max(Math.floor(total / (1000 * 60 * 60 * 24)), 0);
    return { total, days, hours, minutes, seconds };
};

export const calculateNewUserScore = (product: Product): number => {
    // Inventory càng ít (bán chạy) thì điểm càng cao
    const inventoryWeight = Math.max(0, 100 - (product.inventory || 0)); 
    return (inventoryWeight * 2) ;
};

export const calculateMemberScore = (product: Product): number => {
    const views = product.viewCount || 0;
    const rating = product.rating || 0;
    return (views * 3) + (rating * 10);
};