import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useProductFeatures } from '../hooks/useProductFeatures';
import categories from '../mock-data/categories.json';

import ProductSidebar from '../Pages/ProductSidebar';
import ProductGrid from '../Pages/ProductGrid';

import '../Styles/product.css';
import '../Styles/layout.css';

const Product: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { products, loading, error } = useProducts();
    const { 
        currentProducts, totalCount, currentPage, totalPages, sortOption, selectedCategoryId,
        selectedPriceRange, searchQuery, handleCategoryChange, handleSortChange, handlePriceChange, 
        setCurrentPage 
    } = useProductFeatures({ products, itemsPerPage: 9 });

    // Logic xử lý URL Params đồng nhất
    const updateURL = (newParams: URLSearchParams) => {
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const onCategoryClick = (id: number | 'all') => {
        const stringId = id.toString();
        handleCategoryChange(stringId);
        const params = new URLSearchParams(searchParams);
        stringId === 'all' ? params.delete('cat') : params.set('cat', stringId);
        updateURL(params);
    };

    const onPriceClick = (rangeId: string) => {
        handlePriceChange(rangeId);
        const params = new URLSearchParams(searchParams);
        let prices = params.getAll('price');
        prices = prices.includes(rangeId) ? prices.filter(p => p !== rangeId) : [...prices, rangeId];
        params.delete('price');
        prices.forEach(p => params.append('price', p));
        updateURL(params);
    };

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
                    onCategoryClick={onCategoryClick}
                    onPriceClick={onPriceClick}
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
                        onPageChange: setCurrentPage
                    }}
                />
            </div>
        </div>
    );
};

export default Product;