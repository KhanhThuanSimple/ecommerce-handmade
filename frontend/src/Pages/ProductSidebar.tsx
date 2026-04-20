import React from 'react';
import { PRICE_RANGES } from '../hooks/useProductFeatures';

interface SidebarProps {
    categories: any[];
    selectedCategoryId: string;
    selectedPriceRange: string[];
    onCategoryClick: (id: number | 'all') => void;
    onPriceClick: (rangeId: string) => void;
}

const ProductSidebar: React.FC<SidebarProps> = ({ 
    categories, selectedCategoryId, selectedPriceRange, onCategoryClick, onPriceClick 
}) => {
    return (
        <aside className="shop-sidebar">
            <div className="filter-group">
                <h3>Danh Mục</h3>
                <ul className="category-list">
                    <li>
                        <button 
                            className={selectedCategoryId === 'all' ? 'active' : ''} 
                            onClick={() => onCategoryClick('all')}
                        >
                            Tất cả sản phẩm
                        </button>
                    </li>
                    {categories.map(cat => (
                        <li key={cat.id}>
                            <button
                                className={selectedCategoryId === cat.id.toString() ? 'active' : ''}
                                onClick={() => onCategoryClick(cat.id)}
                            >
                                {cat.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="filter-group">
                <h3>Khoảng Giá</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {PRICE_RANGES.map(range => (
                        <label key={range.id} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={selectedPriceRange.includes(range.id)}
                                onChange={() => onPriceClick(range.id)}
                            />
                            {range.label}
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default ProductSidebar;