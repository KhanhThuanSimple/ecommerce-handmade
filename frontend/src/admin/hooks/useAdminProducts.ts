import { useEffect, useState } from 'react';
import { getAdminProducts, putProductStock, patchProductStatus, deleteProduct, postImportProducts, AdminProductItem } from './adminService';
import { useNotify } from '../../components/NotificationContext';

export const useAdminProducts = () => {
    const [products, setProducts] = useState<AdminProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false); 
    const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0, currentPage: 0 });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [inputStock, setInputStock] = useState<number>(0);
    
    // CẢI TIẾN: Tách biệt status và bổ sung inventoryStatus chuẩn API mới
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        inventoryStatus: '', // Thêm trường lọc kho riêng biệt ở đây
        categoryId: '',
        page: 0
    });

    const notify = useNotify();

    const loadData = async () => {
        setLoading(true);
        try {
            // Đảm bảo hàm getAdminProducts(filters) sẽ đẩy đủ cả ?inventoryStatus=... lên URL
            const data = await getAdminProducts(filters);
            setProducts(data.content || []); 
            setPageInfo({
                totalPages: data.totalPages,
                totalElements: data.totalElements,
                currentPage: data.number
            });
        } catch (err: any) {
            console.error(err);
          const errorData = err.response?.data;
const errorMsg = typeof errorData === 'object' ? (errorData.message || errorData.error) : errorData;
notify.error(errorMsg || "Không thể tải danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    // Theo dõi thêm sự thay đổi của filters.inventoryStatus để tự động reload bảng
    useEffect(() => {
        void loadData();
    }, [filters.page, filters.status, filters.inventoryStatus, filters.categoryId]); 

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 0 })); 
        void loadData();
    };

    const handleSaveStock = async (productId: number) => {
        try {
            await putProductStock(productId, inputStock);
            notify.success("Cập nhật số lượng kho thành công!");
            setEditingId(null);
            void loadData();
        } catch (err: any) {
         const errorData = err.response?.data;
const errorMsg = typeof errorData === 'object' ? (errorData.message || errorData.error) : errorData;
notify.error(errorMsg || "Không thể cập nhật số lượng kho!");
        }
    };

    const handleStatusChange = async (productId: number, currentStatus: string) => {
        const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
            try {
                await patchProductStatus(productId, nextStatus);
                notify.success("Đổi trạng thái thành công!");
                void loadData();
            } catch (err: any) {
                notify.error(err.response?.data || "Lỗi khi đổi trạng thái hiển thị!");
            }
        
    };

    const handleDelete = async (productId: number) => {
            try {
                await deleteProduct(productId);
                notify.success("Xóa sản phẩm thành công!");
                void loadData();
            } catch (err: any) {
                const errorData = err.response?.data;
const errorMsg = typeof errorData === 'object' ? (errorData.message || errorData.error) : errorData;
notify.error(errorMsg || "Không thể xóa sản phẩm này!");
            }
        
    };

    const handleImportExcel = async (file: File) => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension !== 'xlsx') {
            notify.error("Hệ thống từ chối! Vui lòng chọn đúng file Excel định dạng .xlsx");
            return;
        }

        if (window.confirm(`Xác nhận nhập dữ liệu sản phẩm từ file: "${file.name}"?`)) {
            setImporting(true);
            try {
                const report = await postImportProducts(file);
                alert(report); 
                void loadData(); 
            } catch (err: any) {
                const errorData = err.response?.data;
const errMsg = typeof errorData === 'object' ? (errorData.message || errorData.error) : errorData;
alert(`❌ IMPORT THẤT BẠI:\n${errMsg || "Cấu trúc file lỗi hoặc không thể đọc dữ liệu!"}`);
            } finally {
                setImporting(false);
            }
        }
    };

    return {
        products,
        loading,
        importing, 
        pageInfo,
        editingId,
        inputStock,
        filters,
        setFilters,
        setInputStock,
        handleSearchSubmit,
        handleSaveStock,
        handleStatusChange,
        handleDelete,
        handleImportExcel,
        handleStartEdit: (id: number, stock: number) => { setEditingId(id); setInputStock(stock); },
        handleCancelEdit: () => setEditingId(null)
    };
};