import { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types/model';


export const PRICE_RANGES = [
    { id: 'under-100', label: 'Dưới 100k', min: 0, max: 100000 },
    { id: '100-500', label: '100k - 500k', min: 100000, max: 500000 },
    { id: 'over-500', label: 'Trên 500k', min: 500000, max: Infinity },
];

export const useProductFeatures = ({ products, itemsPerPage = 9 }: { products: Product[] | null, itemsPerPage?: number }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedCategoryId = searchParams.get('cat') || 'all';
    const selectedPriceRange = searchParams.getAll('price');
    const sortOption = searchParams.get('sort') || 'default';
    const currentPage = parseInt(searchParams.get('page') || '1');
    const searchQuery = searchParams.get('search') || '';

    // 1. Lọc sản phẩm
    const filteredProducts = useMemo(() => {
        let result = products ?? [];
        
        // Lọc theo Search Query - Tìm kiếm trong nhiều trường
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(p => {
                const nameMatch = p.name.toLowerCase().includes(query);
                const descMatch = p.description.toLowerCase().includes(query);
                const categoryMatch = p.category.toLowerCase().includes(query);
                const priceMatch = !isNaN(Number(query)) && 
                    p.price.toString().includes(query.replace(/[^\d]/g, ''));
                const idMatch = !isNaN(Number(query)) && 
                    p.id.toString().includes(query.replace(/[^\d]/g, ''));
                return nameMatch || descMatch || categoryMatch || priceMatch || idMatch;
            });
        }
        
        if (selectedCategoryId !== 'all') {
            result = result.filter(p => p.categoryId.toString() === selectedCategoryId);
        }
        if (selectedPriceRange.length > 0) {
            result = result.filter(product =>
                selectedPriceRange.some(rangeId => {
                    const range = PRICE_RANGES.find(r => r.id === rangeId);
                    return range ? (product.price >= range.min && product.price < range.max) : false;
                })
            );
        }
        return result;
    }, [products, searchQuery, selectedCategoryId, selectedPriceRange]);

    // 2. Sắp xếp
    const sortedProducts = useMemo(() => {
        const sorted = [...filteredProducts];
        if (sortOption === 'price-asc') sorted.sort((a, b) => a.price - b.price);
        if (sortOption === 'price-desc') sorted.sort((a, b) => b.price - a.price);
        if (sortOption === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
        return sorted;
    }, [filteredProducts, sortOption]);

    const totalCount = filteredProducts.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    console.log({ totalCount, itemsPerPage, totalPages }); // Xem kết quả ở Console

    console.log({ totalCount, itemsPerPage, totalPages }); // Xem kết quả ở Console
    // 3. Cập nhật URL
    const updateParams = (key: string, value: string | string[] | null) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete(key);
        if (value && value !== 'all') {
            if (Array.isArray(value)) value.forEach(v => newParams.append(key, v));
            else newParams.set(key, value);
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    // Reset về trang 1 khi search query thay đổi
    useEffect(() => {
        if (searchQuery) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('page', '1');
            setSearchParams(newParams);
        }
    }, [searchQuery, searchParams, setSearchParams]);

    return {
        searchQuery,
        currentProducts: sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
        totalCount,
        totalPages,
        currentPage,
        selectedCategoryId,
        selectedPriceRange,
        sortOption,
        handleCategoryChange: (id: string) => updateParams('cat', id),
        handlePriceChange: (id: string) => {
            const next = selectedPriceRange.includes(id) 
                ? selectedPriceRange.filter(p => p !== id) 
                : [...selectedPriceRange, id];
            updateParams('price', next);
        },
        handleSortChange: (e: any) => updateParams('sort', e.target.value),
        setCurrentPage: (page: number) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('page', page.toString());
            setSearchParams(newParams);
        }
    };
};