// Định nghĩa Model Product dùng chung cho toàn dự án
export interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    categoryId: number;
    imageUrl: string;
    description: string;
    inventory: number;
    rating?: number; 
    commentCount?: number;
    viewCount?: number;
}

// Bạn cũng nên chuyển User interface vào đây luôn
export interface User {
    id: number;
    email: string;
    username: string;
    password?: string;
    wishlist?: Product[];
    lastSpinDate?: string; // Lưu dạng ISO (YYYY-MM-DD)
    points?: number;
    isLoggedIn?: boolean; // Thuộc tính ảo để check trạng thái tại client
}
export interface CartItem {
    product: Product;
    quantity: number;
}
export interface Cart {
    id: number;
    items: CartItem[];
    totalPrice: number;
}
export interface Category {
    id: number;
    name: string;
}
export interface PriceRange {
    id: string;
    label: string;
}
export interface Review {
    id: string;
    productId: number;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
}
 export interface FAQItem {
    id: string;
    keywords: string[];
    action: string;
    responseText: string;
    targetCategory?: string; // Có dấu ? vì không phải mục nào cũng có
    categoryId?: string;     // Có dấu ? vì không phải mục nào cũng có
}
export interface Prize {
  id: number;
  name: string;
  type: 'points' | 'voucher' | 'discount' | 'none';
  value?: number;
  color: string;
  textColor: string;
  icon: string;
  description: string;
}