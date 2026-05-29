import React from 'react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import '../styles/products.css';

const AdminProducts: React.FC = () => {
    const {
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
        handleStartEdit,
        handleCancelEdit
    } = useAdminProducts();

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            void handleImportExcel(files[0]);
            e.target.value = ''; 
        }
    };

    return (
        <div className="admin-products">
            <div className="products-main">
                {/* HEADER ZONE */}
                <div className="products-header">
                    <div className="header-title">
                        <h2>
                            <span>📦</span> 
                            Quản Trị Kho và Trạng Thái Sản Phẩm
                        </h2>
                        <p>
                            Tổng số kết quả tìm thấy: 
                            <span className="total-count">{pageInfo.totalElements}</span> mặt hàng
                        </p>
                    </div>

                    <div className="import-section">
                        <label 
                            className={`import-btn ${importing ? 'disabled' : ''}`}
                        >
                            <span>{importing ? '⏳' : '📥'}</span>
                            <span>{importing ? 'Đang nạp...' : 'Nhập Excel'}</span>
                            <input 
                                type="file" 
                                accept=".xlsx" 
                                onChange={onFileChange} 
                                disabled={importing}
                                style={{ display: 'none' }} 
                            />
                        </label>
                    </div>
                </div>

                <div className="scrollable-content">
                    {/* FILTER BAR */}
                    <form onSubmit={handleSearchSubmit} className="filter-bar">
                        <div className="filter-group">
                            <label>Tìm kiếm</label>
                            <input 
                                type="text" 
                                placeholder="Tên sản phẩm..." 
                                value={filters.keyword}
                                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                                className="filter-input"
                            />
                        </div>

                        <div className="filter-group">
                            <label>Trạng thái</label>
                            <select 
                                value={filters.status} 
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 0 }))}
                                className="filter-select"
                            >
                                <option value="">-- Tất cả --</option>
                                <option value="active">Đang bán</option>
                                <option value="inactive">Tạm ẩn</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Tình trạng kho</label>
                            <select 
                                value={filters.inventoryStatus} 
                                onChange={(e) => setFilters(prev => ({ ...prev, inventoryStatus: e.target.value, page: 0 }))}
                                className="filter-select inventory-filter"
                            >
                                <option value="">-- Tất cả --</option>
                                <option value="EMPTY">❌ Hết hàng</option>
                                <option value="LOW">⚠️ Sắp hết (1-5)</option>
                                <option value="AVAILABLE">✅ Còn hàng (&gt;5)</option>
                            </select>
                        </div>

                        <button type="submit" className="search-btn">
                            Tìm kiếm
                        </button>
                    </form>

                    {/* TABLE */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner">⏳</div>
                            <span>Đang tải dữ liệu...</span>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Mã SP</th>
                                            <th>Tên Sản Phẩm</th>
                                            <th>Đơn Giá</th>
                                            <th>Số Lượng Kho</th>
                                            <th>Trạng Thái</th>
                                            <th>Thao Tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan={6}>
                                                    <div className="empty-state">
                                                        <div className="empty-icon">📭</div>
                                                        <div className="empty-text">
                                                            Không tìm thấy sản phẩm nào!
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((p) => {
                                                const displayPrice = p.price ?? 0;
                                                const displayStock = p.inventory ?? 0;
                                                
                                                let stockBadgeClass = 'badge-stock available';
                                                if (displayStock === 0) {
                                                    stockBadgeClass = 'badge-stock empty';
                                                } else if (displayStock <= 5) {
                                                    stockBadgeClass = 'badge-stock low';
                                                }

                                                return (
                                                    <tr key={p.id}>
                                                        <td><strong>#{p.id}</strong></td>
                                                        <td>{p.name}</td>
                                                        <td>₫{displayPrice.toLocaleString('vi-VN')}</td>
                                                        <td>
                                                            {editingId === p.id ? (
                                                                <div className="stock-edit-form">
                                                                    <input 
                                                                        type="number" 
                                                                        value={inputStock} 
                                                                        onChange={(e) => setInputStock(Number(e.target.value))} 
                                                                        min="0"
                                                                        className="stock-input"
                                                                    />
                                                                    <button 
                                                                        onClick={() => handleSaveStock(p.id)}
                                                                        className="btn-icon btn-save"
                                                                    >
                                                                        Lưu
                                                                    </button>
                                                                    <button 
                                                                        onClick={handleCancelEdit}
                                                                        className="btn-icon btn-cancel"
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    <span className={stockBadgeClass}>
                                                                        {displayStock === 0 ? 'Hết hàng' : `${displayStock} chiếc`}
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => handleStartEdit(p.id, displayStock)}
                                                                        className="btn-icon btn-edit"
                                                                    >
                                                                        Sửa
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge-status ${p.status === 'active' ? 'active' : 'inactive'}`}>
                                                                {p.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button 
                                                                    onClick={() => handleStatusChange(p.id, p.status)}
                                                                    className="btn-toggle"
                                                                >
                                                                    {p.status === 'active' ? 'Ẩn' : 'Hiện'}
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(p.id)}
                                                                    className="btn-delete"
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* PAGINATION */}
                            <div className="pagination">
                                <button 
                                    className="pagination-btn"
                                    disabled={filters.page === 0} 
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    ← Trước
                                </button>
                                <span className="pagination-info">
                                    {filters.page + 1} / {pageInfo.totalPages || 1}
                                </span>
                                <button 
                                    className="pagination-btn"
                                    disabled={filters.page >= pageInfo.totalPages - 1} 
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Sau →
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProducts;