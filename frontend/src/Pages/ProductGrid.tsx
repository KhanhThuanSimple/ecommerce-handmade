import React from 'react';
import ProductCard from './ProductCard';
import { User } from '../types/model';
interface ProductGridProps {
    products: any[];
    totalCount: number;
    currentUser?: User | null;

    sortOption: string;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    title: string;
    loading: boolean;
    error: string | null;
    pagination: any;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
    products, totalCount, currentUser, sortOption, onSortChange, title, loading, error, pagination 
}) => {
const { currentPage, totalPages, onPageChange } = pagination;

    if (loading) return <div className="loading">Đang tải...</div>;
    if (error) return <div className="error">{error}</div>;
    const getPaginationRange = () => {
    const delta = 2; // Số trang hiển thị bên cạnh trang hiện tại
    const range = [];
    const rangeWithDots = [];
    let l;

    // Luôn bao gồm trang đầu, trang cuối và các trang xung quanh currentPage
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            range.push(i);
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots;
};
    return (
        <main className="shop-main">
            <header className="shop-header">
                <h2>{title}</h2>
                <div className="shop-toolbar">
                    <span className="product-count">Hiển thị {products.length} trên {totalCount} sản phẩm</span>
                    <select value={sortOption} onChange={onSortChange} className="sort-select">
                        <option value="default">Mặc định</option>
                        <option value="price-asc">Giá: Thấp đến Cao</option>
                        <option value="price-desc">Giá: Cao đến Thấp</option>
                        <option value="name-asc">Tên: A-Z</option>
                    </select>
                </div>
            </header>

            <div className="pro-product-grid">
                {products.length > 0 ? (
                    products.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            currentUser={currentUser ?? null} 
                        />
                    ))
                ) : (
                    <div className="no-products">Không tìm thấy sản phẩm nào phù hợp.</div>
                )}
            </div>

            {/* HIỂN THỊ PHÂN TRANG TẠI ĐÂY */}
           {totalPages > 1 && (
    <div className="pagination-container">
        <button 
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
        >
            Trước
        </button>

        {getPaginationRange().map((page, index) => {
            if (page === '...') {
                return <span key={`dots-${index}`} className="pagination-dots">...</span>;
            }

            return (
                <button
                    key={`page-${page}`}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => onPageChange(Number(page))}
                >
                    {page}
                </button>
            );
        })}

        <button 
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
        >
            Sau
        </button>
    </div>
)}
        </main>
    );
};
export default ProductGrid;