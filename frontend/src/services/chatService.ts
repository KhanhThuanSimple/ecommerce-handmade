import api from './api';
import faqData from '../mock-data/faq.json';
import { FAQItem } from '../types/model';

export const ChatService = {
    async getHistory(userId: string) {
        const res = await api.get(`/messages?userId=${userId}`);
        return res.data;
    },

    async saveMessage(msgData: any) {
        const res = await api.post('/messages', msgData);
        return res.data;
    },

    async findContextData(userInput: string): Promise<string> {
        try {
            const lowerInput = userInput.trim().toLowerCase();
            
            // 1. Tìm match trong FAQ với kiểu dữ liệu FAQItem
            const match = (faqData as FAQItem[]).find((f) => 
                f.keywords.some((key: string) => lowerInput.includes(key.toLowerCase()))
            );

            if (!match) return "";

            // 2. Metadata danh mục - Cung cấp ID để AI tạo link: /products?page=1&cat=ID
            const categoryMeta = `[HỆ THỐNG DANH MỤC]: { id: "${match.categoryId || ''}", tên: "${match.targetCategory || ''}" }`;

            // 3. Xử lý khi yêu cầu hiển thị sản phẩm
            if (match.action === "SHOW_PRODUCT" && match.targetCategory) {
                // Encode URL để tránh lỗi tiếng Việt có dấu
                const res = await api.get(`/products?category=${encodeURIComponent(match.targetCategory)}`);
                const products = res.data;

                // Lọc sản phẩm liên quan theo tên
                const relatedProducts = products.filter((p: any) => 
                    p.name.toLowerCase().includes(lowerInput)
                );

                // Ưu tiên sản phẩm liên quan, nếu không có thì lấy 3 sản phẩm đầu của danh mục
                const displayList = relatedProducts.length > 0 ? relatedProducts : products.slice(0, 3);

                if (displayList.length > 0) {
                    const productListText = displayList
                        .map((p: any) => `- ${p.name} | Giá: ${p.price.toLocaleString()}đ | ID: ${p.id}`)
                        .join("\n");
                    
                    return `${categoryMeta}\nSẢN PHẨM HIỆN CÓ:\n${productListText}\nTHÔNG ĐIỆP GỐC: ${match.responseText}`;
                } else {
                    // Trường hợp danh mục tồn tại nhưng không có sản phẩm nào bên trong
                    return `${categoryMeta}\nSẢN PHẨM HIỆN CÓ: HẾT HÀNG\nTHÔNG ĐIỆP GỐC: ${match.responseText}`;
                }
            }

            // 4. Các trường hợp hỏi đáp thông thường (không cần list sản phẩm)
            return `${categoryMeta}\nTHÔNG ĐIỆP GỐC: ${match.responseText}`;
        } catch (error) {
            console.error("Lỗi ChatService:", error);
            return "";
        }
    }
};