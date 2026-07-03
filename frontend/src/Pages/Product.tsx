import React from 'react';
import { useProducts } from '../hooks/useProducts';
import { useProductFeatures } from '../hooks/useProductFeatures';
import categories from '../mock-data/categories.json';

import ProductSidebar from '../Pages/ProductSidebar';
import ProductGrid from '../Pages/ProductGrid';

import '../Styles/product.css';
import '../Styles/layout.css';

const Product: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    const { products, loading, error } = useProducts();
    const {
        currentProducts,
        totalCount,
        currentPage,
        totalPages,
        sortOption,
        selectedCategoryId,
        selectedPriceRange,
        searchQuery,
        handleCategoryChange,
        handleSortChange,
        handlePriceChange,
        setCurrentPage,
    } = useProductFeatures({ products, itemsPerPage: 8 });

    const pageTitle = searchQuery
        ? `Kết quả tìm kiếm: "${searchQuery}"`
        : selectedCategoryId === 'all'
            ? 'Bộ Sưu Tập'
            : categories.find(c => c.id.toString() === selectedCategoryId)?.name || 'Sản phẩm';

    return (
        <div className="shop-container">
            <div className="shop-layout">
                <ProductSidebar
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    selectedPriceRange={selectedPriceRange}
                    onCategoryClick={(id) => handleCategoryChange(id.toString())}
                    onPriceClick={handlePriceChange}
                />
                <ProductGrid
                    title={pageTitle}
                    products={currentProducts}
                    totalCount={totalCount}
                    currentUser={currentUser}
                    sortOption={sortOption}
                    onSortChange={handleSortChange}
                    loading={loading}
                    error={error}
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: setCurrentPage,
                    }}
                />
            </div>
        </div>
    );
};

export default Product;
