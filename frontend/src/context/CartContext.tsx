import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/model';
import api from '../services/api';
import { useNotify } from '../components/NotificationContext';

interface CartContextType {
    cartCount: number;
    refreshCart: () => Promise<void>;
    addToCart: (product: any, currentUser: User | null) => Promise<void>;
    mergeCart: (userId: string | number) => Promise<void>; // Hàm mới
}

const CartContext = createContext<CartContextType | undefined>(undefined);
export const CartProvider = ({ children, currentUser }: { children: ReactNode, currentUser: User | null }) => {
    const [cartCount, setCartCount] = useState(0);
    const notify = useNotify();
console.log('notify:', notify);


    const refreshCart = async () => {
        if (!currentUser) {
            // Nếu chưa login, đếm số loại sp trong localStorage
            const localData = localStorage.getItem('guestCart');
            const items = localData ? JSON.parse(localData) : [];
            setCartCount(items.length);
            return;
        }
        try {
            const res = await api.get(`/carts?userId=${currentUser.id}`);
            if (res.data.length > 0) {
                setCartCount(res.data[0].items?.length || 0);
            } else {
                setCartCount(0);
            }
        } catch (err) {
            console.error("Lỗi cập nhật Badge:", err);
        }
    };

    const addToCart = async (product: any, user: User | null) => {
        if (!product || product.inventory <= 0) {
              notify.warning("Sản phẩm đã hết hàng!");
            return ;
        }
        if (!user) {
            // --- CHƯA LOGIN: LƯU LOCALSTORAGE ---
            const localData = localStorage.getItem('guestCart');
            let items = localData ? JSON.parse(localData) : [];

            const existingItem = items.find((i: any) => i.productId === product.id);
            if (existingItem) {
                items = items.map((i: any) =>
                    i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                items.push({ productId: product.id, quantity: 1 });
            }

            localStorage.setItem('guestCart', JSON.stringify(items));
            await refreshCart();
            notify.success(`Đã thêm "${product.name}" vào giỏ hàng`);

            return;
        }

        // --- ĐÃ LOGIN: LƯU SERVER ---
        try {
            const res = await api.get(`/carts?userId=${user.id}`);
            let userCart = res.data[0];

            if (!userCart) {
                const newCart = { userId: user.id, items: [{ productId: product.id, quantity: 1 }] };
                await api.post('/carts', newCart);
            } else {
                const existingItem = userCart.items.find((i: any) => i.productId === product.id);
                const newItems = existingItem
                    ? userCart.items.map((i: any) =>
                        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
                    )
                    : [...userCart.items, { productId: product.id, quantity: 1 }];

                await api.patch(`/carts/${userCart.id}`, { items: newItems });
            }
            await refreshCart();
        notify.success(`Đã thêm "${product.name}" vào giỏ hàng`);
        } catch (error) {
            notify.error("Không thể thêm vào giỏ hàng!");

        }
    };

    // Hàm gộp giỏ hàng từ LocalStorage lên Server
    const mergeCart = async (userId: string | number) => {
        const localData = localStorage.getItem('guestCart');
        if (!localData) return;

        const guestItems = JSON.parse(localData);
        if (guestItems.length === 0) return;

        try {
            const res = await api.get(`/carts?userId=${userId}`);
            let userCart = res.data[0];

            if (!userCart) {
                await api.post('/carts', { userId, items: guestItems });
            } else {
                let finalItems = [...userCart.items];
                guestItems.forEach((gItem: any) => {
                    const exist = finalItems.find(i => i.productId === gItem.productId);
                    if (exist) {
                        exist.quantity += gItem.quantity;
                    } else {
                        finalItems.push(gItem);
                    }
                });
                await api.patch(`/carts/${userCart.id}`, { items: finalItems });
            }
            localStorage.removeItem('guestCart'); // Xóa sau khi đã gộp thành công
        } catch (err) {
        notify.error("Không thể thêm vào giỏ hàng!");
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