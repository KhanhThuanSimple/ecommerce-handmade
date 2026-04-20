import React from 'react';
import { useWishlist } from '../hooks/useWishlist';
import { FaShoppingCart, FaTrashAlt, FaHeart, FaCheckSquare, FaRegSquare, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import '../Styles/Wishlist.css';

const Wishlist: React.FC = () => {
    const {
        wishlist,
        currentUser,
        selectedIds,
        setSelectedIds,
        toast,
        navigate,
        addToCart,
        triggerNotification,
        syncDatabase,
        handleBulkAdd,
        handleBulkDelete
    } = useWishlist();

    return (
        <div className="wishlist-container">
            <div className="wishlist-header">
                <h2>Sản phẩm yêu thích</h2>
            </div>

            {wishlist.length > 0 ? (
                <>
                    <div className="wishlist-bulk-actions">
                        <div className="select-all-wrapper" onClick={() => setSelectedIds(selectedIds.length === wishlist.length ? [] : wishlist.map(p => p.id))}>
                            {React.createElement((selectedIds.length === wishlist.length ? FaCheckSquare : FaRegSquare) as any, {
                                color: selectedIds.length === wishlist.length ? "#28a745" : "#ccc", size: 22
                            })}
                            <span>Chọn tất cả ({selectedIds.length})</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-ui" style={{ color: '#ff4757', background: '#fff0f0' }} onClick={handleBulkDelete} disabled={selectedIds.length === 0}>
                                {React.createElement(FaTrashAlt as any)} Xóa mục chọn
                            </button>
                            <button className="btn-ui btn-ui-buy" onClick={handleBulkAdd} disabled={selectedIds.length === 0}>
                                {React.createElement(FaShoppingCart as any)} Thêm vào giỏ hàng
                            </button>
                        </div>
                    </div>

                    <div className="wishlist-grid">
                        {wishlist.map(item => (
                            <div key={item.id} className="wishlist-card">
                                <div className="card-checkbox" onClick={() => setSelectedIds((prev: number[]) => prev.includes(item.id) ? prev.filter((id: number) => id !== item.id) : [...prev, item.id])}>
                                    {React.createElement((selectedIds.includes(item.id) ? FaCheckSquare : FaRegSquare) as any, {
                                        color: selectedIds.includes(item.id) ? "#28a745" : "#ddd", size: 24
                                    })}
                                </div>
                                <div className="card-image-wrapper">
                                    <img src={item.imageUrl} alt={item.name} />
                                    <div className="btn-remove-single" onClick={() => syncDatabase(wishlist.filter(p => p.id !== item.id))}>
                                        {React.createElement(FaTrashAlt as any, { size: 16 })}
                                    </div>
                                </div>
                                <div className="card-content">
                                    <h4>{item.name}</h4>
                                    <p className="card-price">{item.price.toLocaleString()} VNĐ</p>
                                    <div className="card-btns">
                                        <button className="btn-ui btn-ui-view" onClick={() => navigate(`/products/${item.id}`)}>Chi tiết</button>
                                        <button className="btn-ui btn-ui-buy" onClick={() => { addToCart(item, currentUser); triggerNotification("Đã thêm vào giỏ hàng!"); }}>
                                            + Giỏ hàng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="wishlist-empty">
                    {React.createElement(FaHeart as any, { size: 80, color: '#f1f2f6' })}
                    <h3 style={{marginTop: '20px', color: '#2f3542'}}>Danh sách yêu thích trống</h3>
                    <button className="btn-ui btn-ui-buy" style={{marginTop: '20px', padding: '12px 30px'}} onClick={() => navigate('/')}>Tiếp tục mua sắm</button>
                </div>
            )}

            {toast.show && (
                <div className="toast-box">
                    {React.createElement((toast.type === 'success' ? FaCheckCircle : FaInfoCircle) as any, { 
                        color: toast.type === 'success' ? '#2ed573' : '#eccc68', size: 20, 
                    })}
                    <span>{toast.msg}</span>
                </div>
            )}
        </div>
    );
};

export default Wishlist;