import React, {
    useState,
    useEffect,
    ChangeEvent,
    FormEvent
} from 'react';
import '../styles/admin.css';

import {
    PencilIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

import { Product } from '../../types/model';

interface ProductFormData {
    name: string;
    price: string;
    category: string;
    inventory: string;
    description: string;
    status: 'active' | 'inactive' | 'lowstock';
}

const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const [editingProduct, setEditingProduct] =
        useState<Product | null>(null);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        price: '',
        category: '',
        inventory: '',
        description: '',
        status: 'active'
    });

    useEffect(() => {
        setProducts([
            {
                id: 1,
                name: 'Bộ ấm trà Mã Đáo Thành Công',
                price: 1250000,
                category: 'Trà cụ',
                categoryId: 1,
                imageUrl: '',
                description: 'Bộ ấm trà phong cách truyền thống',
                inventory: 15,
                status: 'active',
                soldCount: 45
            },
            {
                id: 2,
                name: 'Tượng Ngựa Phong Thủy Mạ Vàng',
                price: 2350000,
                category: 'Trang trí',
                categoryId: 2,
                imageUrl: '',
                description: 'Tượng phong thủy cao cấp',
                inventory: 8,
                status: 'active',
                soldCount: 67
            },
            {
                id: 3,
                name: 'Đĩa Gốm Hoa Mai',
                price: 450000,
                category: 'Gốm sứ',
                categoryId: 3,
                imageUrl: '',
                description: 'Đĩa gốm trang trí hoa mai',
                inventory: 25,
                status: 'active',
                soldCount: 38
            },
            {
                id: 4,
                name: 'Lọ Hoa Tết Đỏ',
                price: 890000,
                category: 'Trang trí',
                categoryId: 2,
                imageUrl: '',
                description: 'Lọ hoa trang trí ngày Tết',
                inventory: 5,
                status: 'lowstock',
                soldCount: 52
            },
            {
                id: 5,
                name: 'Set Quà Tết Cao Cấp',
                price: 3450000,
                category: 'Quà tặng',
                categoryId: 4,
                imageUrl: '',
                description: 'Set quà handmade cao cấp',
                inventory: 3,
                status: 'lowstock',
                soldCount: 29
            }
        ]);
    }, []);

    const handleInputChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const categoryMap: Record<string, number> = {
            'Trà cụ': 1,
            'Trang trí': 2,
            'Gốm sứ': 3,
            'Quà tặng': 4
        };

        if (editingProduct) {
            setProducts(
                products.map((p) =>
                    p.id === editingProduct.id
                        ? {
                              ...p,
                              name: formData.name,
                              price: Number(formData.price),
                              category: formData.category,
                              categoryId:
                                  categoryMap[formData.category] || 0,
                              inventory: Number(formData.inventory),
                              description: formData.description,
                              status: formData.status
                          }
                        : p
                )
            );
        } else {
            const newProduct: Product = {
                id: Date.now(),
                name: formData.name,
                price: Number(formData.price),
                category: formData.category,
                categoryId:
                    categoryMap[formData.category] || 0,
                imageUrl: '',
                description: formData.description,
                inventory: Number(formData.inventory),
                status: formData.status,
                soldCount: 0
            };

            setProducts([...products, newProduct]);
        }

        handleCloseModal();
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);

        setFormData({
            name: product.name,
            price: product.price.toString(),
            category: product.category,
            inventory: product.inventory.toString(),
            description: product.description,
            status: product.status || 'active'
        });

        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            setProducts(products.filter((p) => p.id !== id));
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);

        setEditingProduct(null);

        setFormData({
            name: '',
            price: '',
            category: '',
            inventory: '',
            description: '',
            status: 'active'
        });
    };

    const getStatusBadge = (
        status?: 'active' | 'inactive' | 'lowstock'
    ) => {
        if (status === 'active') {
            return (
                <span className="status-badge status-active">
                    Đang bán
                </span>
            );
        }

        if (status === 'lowstock') {
            return (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                    Sắp hết hàng
                </span>
            );
        }

        return (
            <span className="status-badge status-inactive">
                Ngừng bán
            </span>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>Quản Lý Sản Phẩm</span>
                        <span className="text-2xl">🏺</span>
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Quản lý sản phẩm gốm sứ handmade
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="admin-btn-primary flex items-center gap-2 px-5 py-2.5"
                >
                    <PlusIcon className="h-5 w-5" />
                    Thêm Sản Phẩm
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="admin-table w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs">
                                ID
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Tên Sản Phẩm
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Danh Mục
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Giá
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Tồn Kho
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Đã Bán
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Trạng Thái
                            </th>

                            <th className="px-6 py-4 text-left text-xs">
                                Thao Tác
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                className="hover:bg-yellow-50/50 transition"
                            >
                                <td className="px-6 py-4 text-sm">
                                    {product.id}
                                </td>

                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {product.name}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    {product.category}
                                </td>

                                <td className="px-6 py-4 text-sm font-semibold text-red-600">
                                    {new Intl.NumberFormat('vi-VN').format(
                                        product.price
                                    )}
                                    đ
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    <span
                                        className={
                                            product.inventory < 10
                                                ? 'text-orange-600 font-bold'
                                                : ''
                                        }
                                    >
                                        {product.inventory}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-sm font-medium text-yellow-700">
                                    {product.soldCount || 0}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    {getStatusBadge(product.status)}
                                </td>

                                <td className="px-6 py-4 text-sm">
                                    <button
                                        onClick={() =>
                                            handleEdit(product)
                                        }
                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleDelete(product.id)
                                        }
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="admin-modal w-full max-w-lg bg-white rounded-2xl">
                        <div className="modal-header p-5 border-b">
                            <h2 className="text-xl font-bold text-yellow-500">
                                {editingProduct
                                    ? 'Chỉnh Sửa Sản Phẩm'
                                    : 'Thêm Sản Phẩm Mới'}
                            </h2>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-6"
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tên Sản Phẩm
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="admin-input w-full px-4 py-2"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Danh Mục
                                        </label>

                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="admin-input w-full px-4 py-2"
                                        >
                                            <option value="">
                                                Chọn danh mục
                                            </option>

                                            <option value="Trà cụ">
                                                Trà cụ
                                            </option>

                                            <option value="Trang trí">
                                                Trang trí
                                            </option>

                                            <option value="Gốm sứ">
                                                Gốm sứ
                                            </option>

                                            <option value="Quà tặng">
                                                Quà tặng
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Giá (VNĐ)
                                        </label>

                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="admin-input w-full px-4 py-2"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Tồn Kho
                                        </label>

                                        <input
                                            type="number"
                                            name="inventory"
                                            value={formData.inventory}
                                            onChange={handleInputChange}
                                            className="admin-input w-full px-4 py-2"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Trạng Thái
                                        </label>

                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="admin-input w-full px-4 py-2"
                                        >
                                            <option value="active">
                                                Đang bán
                                            </option>

                                            <option value="inactive">
                                                Ngừng bán
                                            </option>

                                            <option value="lowstock">
                                                Sắp hết hàng
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Mô Tả
                                    </label>

                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="admin-input w-full px-4 py-2"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="admin-btn-primary px-6 py-2"
                                >
                                    {editingProduct
                                        ? 'Cập Nhật'
                                        : 'Thêm Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;