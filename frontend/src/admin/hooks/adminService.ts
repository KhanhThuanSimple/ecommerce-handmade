// src/admin/hooks/adminService.ts
import api from '../../services/api'; 

// --- INTERFACES CHUẨN ĐỒNG BỘ VỚI BACKEND ---
export interface UserAdminResponse {
    id: number;
    username: string;
    email: string;
    fullName: string;
    phone: string;
    enabled: boolean;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}

export interface SpringPage<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

// --- API QUẢN TRỊ THÀNH VIÊN (CRM) ---
export const getAdminUsers = async (page = 0, size = 10): Promise<SpringPage<UserAdminResponse>> => {
    const res = await api.get(`/admin/users?page=${page}&size=${size}`);
    return res.data;
};

export const putToggleUserActive = async (userId: number): Promise<string> => {
    const res = await api.put(`/admin/users/${userId}/toggle-status`);
    return res.data;
};

export const putToggleAdminRole = async (userId: number): Promise<string> => {
    const res = await api.put(`/admin/users/${userId}/toggle-role`);
    return res.data;
};


// --- API QUẢN TRỊ SẢN PHẨM & KHO ---  

export interface AdminProductItem {
    id: number;
    name: string;
    price: number;
    category: string;
    categoryId: number;
    imageUrl?: string;
    description?: string;
    inventory: number;
    rating: number;
    commentCount: number;
    status: 'active' | 'inactive'; // Sửa bỏ 'lowstock' vì đây là trạng thái kinh doanh, không phải kho
    soldCount: number;
}

export interface SpringPageResponse {
    content: AdminProductItem[];
    totalPages: number;
    totalElements: number;
    number: number; 
    size: number; 
}

/**
 * 1. LẤY DANH SÁCH SẢN PHẨM KÈM BỘ LỌC ĐA NĂNG ĐÃ SỬA LỖI ĐỒNG BỘ
 * Tự động chuyển đổi các trường rỗng thành undefined để Axios loại bỏ khỏi URL, giúp URL sạch sẽ chuẩn RESTful.
 */
export const getAdminProducts = async (filters: any): Promise<SpringPageResponse> => {
    const response = await api.get<SpringPageResponse>('/admin/products', { 
        params: {
            id: filters.id || undefined,
            keyword: filters.keyword?.trim() || undefined,
            status: filters.status || undefined,
            inventoryStatus: filters.inventoryStatus || undefined, // Đẩy biến lọc kho String lên chuẩn Back-End
            categoryId: filters.categoryId || undefined,
            page: filters.page || 0,
            size: filters.size || 10,
            sortBy: filters.sortBy || 'id',
            sortDir: filters.sortDir || 'desc'
        }
    });
    return response.data;
};

/**
 * 2. CẬP NHẬT NHANH SỐ LƯỢNG TỒN KHO HÀNG
 * Đồng bộ endpoint sử dụng tiền tố /api/admin/products theo chuẩn của bạn
 */
export const putProductStock = async (id: number, stock: number) => {
    return api.patch(`/admin/products/${id}/inventory`, {
        inventory: stock
    });
};

/**
 * 3. THAY ĐỔI TRẠNG THÁI HIỂN THỊ KINH DOANH (ẨN / HIỆN)
 * Đồng bộ endpoint sử dụng tiền tố /api/admin/products
 */
export const patchProductStatus = async (id: number, status: string) => {
    return api.patch(`/admin/products/${id}/status`, null, {
        params: { status }
    });
};

/**
 * 4. XÓA VĨNH VIỄN SẢN PHẨM KHỎI HỆ THỐNG
 * Đồng bộ endpoint sử dụng tiền tố /api/admin/products
 */
export const deleteProduct = async (id: number) => {
    return api.delete(`/admin/products/${id}`);
};

/**
 * 5. NHẬP DANH SÁCH SẢN PHẨM TỰ ĐỘNG TỪ FILE EXCEL
 * Đồng bộ endpoint sử dụng tiền tố /api/admin/products
 */
export const postImportProducts = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file); // Khớp hoàn toàn với @RequestParam("file") MultipartFile bên Spring Boot

    const response = await api.post('/admin/products/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data; // Trả ra chuỗi báo cáo text thô (Ví dụ: "Thành công tuyệt đối!...")
};