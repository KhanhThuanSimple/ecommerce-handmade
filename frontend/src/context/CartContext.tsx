import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/model';
import api from '../services/api';
import { useNotify } from '../components/NotificationContext';

interface CartItem {
    productId: number;
    quantity: number;
}

interface CartContextType {
    cartCount: number;
    refreshCart: () => Promise<void>;
    addToCart: (product: any) => Promise<void>;
    mergeCart: (userId: string | number) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children, currentUser }: { children: ReactNode; currentUser: User | null }) => {
    const [cartCount, setCartCount] = useState(0);
    const notify = useNotify();

    // 1. Refresh Badge giỏ hàng
    const refreshCart = async () => {
        const userString = localStorage.getItem('user');
        const localUser = userString ? JSON.parse(userString) : null;
        const activeUser = currentUser || localUser;

        if (!activeUser) {
            const localData = localStorage.getItem('guestCart');
            const items: CartItem[] = localData ? JSON.parse(localData) : [];
            const total = items.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(total);
            return;
        }

        try {
            const res = await api.get<any[]>(`/carts/${activeUser.id}`);
            const total = res.data.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(total);
        } catch (err) {
            console.error("Lỗi cập nhật số lượng giỏ hàng từ Server:", err);
            setCartCount(0);
        }
    };

    // 2. Thêm vào giỏ hàng an toàn
    const addToCart = async (product: any) => {
        const stock = product.total_inventory !== undefined ? product.total_inventory : (product as any).inventory;
        if (!product || stock <= 0) {
            notify.warning("Sản phẩm này hiện đã hết hàng!");
            return;
        }

        const userString = localStorage.getItem('user');
        const localUser = userString ? JSON.parse(userString) : null;
        const activeUser = currentUser || localUser;

        if (!activeUser) {
            // --- LUỒNG CHƯA ĐĂNG NHẬP (GUEST) ---
            const localData = localStorage.getItem('guestCart');
            let items: CartItem[] = localData ? JSON.parse(localData) : [];

            const existingItem = items.find((i) => i.productId === product.id);
            if (existingItem) {
                if (existingItem.quantity >= stock) {
                    notify.warning(`Sản phẩm này chỉ còn tối đa ${stock} chiếc trong kho!`);
                    return;
                }
                existingItem.quantity += 1;
            } else {
                items.push({ productId: product.id, quantity: 1 });
            }

            localStorage.setItem('guestCart', JSON.stringify(items));
            await refreshCart();
            notify.success(`Đã thêm "${product.name}" vào giỏ hàng tạm.`);
            return;
        }

        // --- LUỒNG ĐÃ ĐĂNG NHẬP (SERVER) ---
        try {
            const payload = {
                userId: Number(activeUser.id), // Đảm bảo ép kiểu số sạch chống lỗi Validation
                productId: Number(product.id),
                quantity: 1
            };

            await api.post('/carts/add', payload);
            await refreshCart();
            notify.success(`Đã thêm "${product.name}" vào giỏ hàng hệ thống thành công!`);
        } catch (error: any) {
            console.error("Lỗi gửi dữ liệu giỏ hàng:", error);
            const errorMsg = error.response?.data?.message || "Không thể thêm vào giỏ hàng lúc này!";
            notify.error(errorMsg);
        }
    };

    // 3. Gộp giỏ hàng vãng lai
    const mergeCart = async (userId: string | number) => {
        const localData = localStorage.getItem('guestCart');
        if (!localData) return;

        const guestItems: CartItem[] = JSON.parse(localData);
        if (guestItems.length === 0) return;

        try {
            const mergePayload = {
                userId: Number(userId),
                items: guestItems 
            };

            await api.post('/carts/merge', mergePayload);
            localStorage.removeItem('guestCart');
            await refreshCart();
        } catch (err) {
            console.error("Lỗi đồng bộ gộp giỏ hàng:", err);
            notify.error("Không thể đồng bộ giỏ hàng vãng lai lên tài khoản!");
        }
    };

    useEffect(() => {
        void refreshCart();
    }, [currentUser]);

    return (
        <CartContext.Provider value={{ cartCount, refreshCart, addToCart, mergeCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
};