import React, { useEffect, useRef } from 'react';
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
    pagination: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
}

const ProductGrid: React.FC<ProductGridProps> = ({
    products, totalCount, currentUser,
    sortOption, onSortChange,
    title, loading, error, pagination,
}) => {
    const { currentPage, totalPages, onPageChange } = pagination;
    const topRef = useRef<HTMLElement>(null);

    // Scroll về đầu grid mỗi khi trang thay đổi
    useEffect(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [currentPage]);

    // ── Tính dải số trang hiển thị ──
    const getPaginationRange = (): (number | '...')[] => {
        const delta = 2;
        const range: number[] = [];
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                range.push(i);
            }
        }

        const result: (number | '...')[] = [];
        let prev: number | undefined;
        for (const page of range) {
            if (prev !== undefined) {
                if (page - prev === 2) result.push(prev + 1);
                else if (page - prev > 2) result.push('...');
            }
            result.push(page);
            prev = page;
        }
        return result;
    };

    if (loading) return <div className="loading">Đang tải...</div>;
    if (error)   return <div className="error">{error}</div>;

    return (
        <main className="shop-main" ref={topRef}>
            {/* ── Header / Toolbar ── */}
            <header className="shop-header">
                <h2>{title}</h2>
                <div className="shop-toolbar">
                    <span className="product-count">
                        Hiển thị {products.length} trên {totalCount} sản phẩm
                    </span>
                    <select
                        value={sortOption}
                        onChange={onSortChange}
                        className="sort-select"
                    >
                        <option value="default">Mặc định</option>
                        <option value="price-asc">Giá: Thấp đến Cao</option>
                        <option value="price-desc">Giá: Cao đến Thấp</option>
                        <option value="name-asc">Tên: A-Z</option>
                    </select>
                </div>
            </header>

            {/* ── Lưới sản phẩm ── */}
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
                    <div className="no-products">
                        Không tìm thấy sản phẩm nào phù hợp.
                    </div>
                )}
            </div>

            {/* ── Phân trang ── */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        ‹ Trước
                    </button>

                    {getPaginationRange().map((page, idx) =>
                        page === '...' ? (
                            <span key={`dots-${idx}`} className="pagination-dots">…</span>
                        ) : (
                            <button
                                key={`page-${page}`}
                                className={`pagination-number${currentPage === page ? ' active' : ''}`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        )
                    )}

                    <button
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        Sau ›
                    </button>
                </div>
            )}
        </main>
    );
};

export default ProductGrid;
