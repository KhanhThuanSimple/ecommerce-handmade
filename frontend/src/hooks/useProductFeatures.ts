import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types/model';

export const PRICE_RANGES = [
    { id: 'under-100', label: 'Dưới 100k',   min: 0,      max: 100000   },
    { id: '100-500',   label: '100k - 500k',  min: 100000, max: 500000   },
    { id: 'over-500',  label: 'Trên 500k',    min: 500000, max: Infinity },
];

export const useProductFeatures = ({
    products,
    itemsPerPage = 8,
}: {
    products: Product[] | null;
    itemsPerPage?: number;
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // ── Đọc state từ URL (single source of truth) ──
    const selectedCategoryId = searchParams.get('cat')    || 'all';
    const selectedPriceRange = searchParams.getAll('price');
    const sortOption         = searchParams.get('sort')   || 'default';
    const searchQuery        = searchParams.get('search') || '';
    const rawPage            = Number(searchParams.get('page') || '1');

    // ── 1. Lọc ──
    const filteredProducts = useMemo(() => {
        let result = products ?? [];

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q)        ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        }

        if (selectedCategoryId !== 'all') {
            result = result.filter(
                p => p.categoryId.toString() === selectedCategoryId
            );
        }

        if (selectedPriceRange.length > 0) {
            result = result.filter(p =>
                selectedPriceRange.some(rid => {
                    const range = PRICE_RANGES.find(r => r.id === rid);
                    return range ? p.price >= range.min && p.price < range.max : false;
                })
            );
        }

        return result;
    }, [products, searchQuery, selectedCategoryId, selectedPriceRange]);

    // ── 2. Sắp xếp ──
    const sortedProducts = useMemo(() => {
        const arr = [...filteredProducts];
        if (sortOption === 'price-asc')  arr.sort((a, b) => a.price - b.price);
        if (sortOption === 'price-desc') arr.sort((a, b) => b.price - a.price);
        if (sortOption === 'name-asc')   arr.sort((a, b) => a.name.localeCompare(b.name));
        return arr;
    }, [filteredProducts, sortOption]);

    // ── 3. Phân trang — tính thuần túy, không side effect ──
    const totalCount = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

    // Clamp page vào [1, totalPages] — không bao giờ ra ngoài
    const currentPage = Math.min(
        Math.max(1, isNaN(rawPage) ? 1 : rawPage),
        totalPages
    );

    const startIdx       = (currentPage - 1) * itemsPerPage;
    const currentProducts = sortedProducts.slice(startIdx, startIdx + itemsPerPage);

    // ── 4. Helpers cập nhật URL ──
    /** Thay đổi 1 param và reset page = 1 */
    const updateFilter = (key: string, value: string | string[] | null) => {
        const p = new URLSearchParams(searchParams);
        p.delete(key);
        if (value && value !== 'all') {
            if (Array.isArray(value)) value.forEach(v => p.append(key, v));
            else p.set(key, value);
        }
        p.set('page', '1');   // <-- luôn về trang 1 khi đổi filter
        setSearchParams(p, { replace: false });
    };

    const setCurrentPage = (page: number) => {
        const p = new URLSearchParams(searchParams);
        p.set('page', page.toString());
        setSearchParams(p, { replace: false });
    };

    return {
        // Dữ liệu đã cắt đúng 8 sp cho trang hiện tại
        currentProducts,
        totalCount,
        totalPages,
        currentPage,
        // Params hiện tại
        searchQuery,
        selectedCategoryId,
        selectedPriceRange,
        sortOption,
        // Handlers
        handleCategoryChange: (id: string) => updateFilter('cat', id),
        handlePriceChange: (id: string) => {
            const next = selectedPriceRange.includes(id)
                ? selectedPriceRange.filter(p => p !== id)
                : [...selectedPriceRange, id];
            updateFilter('price', next);
        },
        handleSortChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
            updateFilter('sort', e.target.value),
        setCurrentPage,
    };
};
