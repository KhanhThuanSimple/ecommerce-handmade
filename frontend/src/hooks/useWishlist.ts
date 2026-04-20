import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Product, User } from '../types/model';
import { useCart } from '../context/CartContext';
import api from '../services/api';

export const useWishlist = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'info' }>({ 
        show: false, msg: '', type: 'success' 
    });

    const triggerNotification = (msg: string, type: 'success' | 'info' = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 2500);
    };

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) {
            const user = JSON.parse(userString);
            setCurrentUser(user);
            setWishlist(user.wishlist || []);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const syncDatabase = async (newList: Product[]) => {
        if (!currentUser) return;
        try {
            await api.patch(`/users/${currentUser.id}`, { wishlist: newList });
            const updatedUser = { ...currentUser, wishlist: newList };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setWishlist(newList);
            window.dispatchEvent(new Event('wishlistUpdated'));
        } catch (error) {
            triggerNotification("Không thể kết nối máy chủ!", "info");
        }
    };

    const handleBulkAdd = () => {
        const itemsToMove = wishlist.filter(p => selectedIds.includes(p.id));
        if (itemsToMove.length === 0) return;
        
        itemsToMove.forEach(p => p.inventory > 0 && addToCart(p, currentUser));
        triggerNotification(`Đã thêm ${itemsToMove.length} sản phẩm vào giỏ hàng!`);
        setSelectedIds([]);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const newList = wishlist.filter(p => !selectedIds.includes(p.id));
        syncDatabase(newList);
        setSelectedIds([]);
        triggerNotification("Đã xóa các mục đã chọn", "info");
    };

    return {
        wishlist,
        currentUser,
        selectedIds,
        setSelectedIds, // Xuất hàm này ra để file giao diện dùng
        toast,
        navigate,
        addToCart,
        triggerNotification,
        syncDatabase,
        handleBulkAdd,
        handleBulkDelete
    };
};