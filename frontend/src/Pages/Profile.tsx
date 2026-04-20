import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User } from '../types/model';
import { useProfile } from '../hooks/useProfile'; 
import '../Styles/profile.css';
import OrderHistory from './OrderHistory';

interface ProfileProps {
    currentUser: User | null;
    onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ currentUser, onLogout }) => {
    // Gọi Hook để lấy tất cả logic và dữ liệu
    const {
        activeSection, setActiveSection,
        emailValue, setEmailValue, emailMessage, emailError, emailLoading,
        passwordValue, setPasswordValue, passwordConfirm, setPasswordConfirm, passwordMessage, passwordError, passwordLoading,
        myVouchers,
        handleUpdateEmail,
        handleUpdatePassword,
        navigate
    } = useProfile(currentUser, onLogout);

    // Kiểm tra đăng nhập
    if (!currentUser) return <Navigate to="/login" replace />;

    const initial = currentUser.username?.charAt(0).toUpperCase() || '?';

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div>
                    <p className="profile-subtitle">Trang cá nhân</p>
                    <h2 className="profile-title">Xin chào, {currentUser.username}</h2>
                    <p className="profile-desc">Quản lý thông tin và bảo mật tài khoản của bạn.</p>
                </div>
                <div className="profile-avatar">{initial}</div>
            </div>

            <div className="profile-container">
                {/* Menu SideBar - Giữ nguyên cấu trúc cũ */}
                <div className="profile-menu">
                    <div className={`menu-item ${activeSection === 'info' ? 'active' : ''}`} onClick={() => setActiveSection('info')}>
                        <i className="fa-solid fa-user-gear"></i> Thông tin tài khoản
                    </div>
                    <div className={`menu-item ${activeSection === 'orders' ? 'active' : ''}`} onClick={() => setActiveSection('orders')}>
                        <i className="fa-solid fa-clock-rotate-left"></i> Lịch sử mua hàng
                    </div>
                    <div className={`menu-item ${activeSection === 'vouchers' ? 'active' : ''}`} onClick={() => setActiveSection('vouchers')}>
                        <i className="fa-solid fa-ticket"></i> Voucher của tôi
                    </div>
                    <Link to="/wishlist" className="menu-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <i className="fa-solid fa-heart"></i> Sản phẩm yêu thích
                    </Link>
                    <Link to="/games" className="menu-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                        🎡 Vòng quay may mắn
                    </Link>
                    <div className={`menu-item ${activeSection === 'email' ? 'active' : ''}`} onClick={() => setActiveSection('email')}>
                        <i className="fa-solid fa-envelope"></i> Thay đổi email
                    </div>
                    <div className={`menu-item ${activeSection === 'password' ? 'active' : ''}`} onClick={() => setActiveSection('password')}>
                        <i className="fa-solid fa-shield-halved"></i> Bảo mật mật khẩu
                    </div>
                    <div className="menu-item logout-item" onClick={onLogout}>
                        <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                    </div>
                </div>

                {/* Content Area - Giữ nguyên tất cả các Section cũ */}
                <div className="profile-content">
                    {/* Section Thông tin */}
                    {activeSection === 'info' && (
                        <section className="profile-card">
                            <h3 className="section-title">Thông tin cơ bản</h3>
                            <div className="info-row"><span>Tên hiển thị</span><strong>{currentUser.username}</strong></div>
                            <div className="info-row"><span>Email hiện tại</span><strong>{currentUser.email}</strong></div>
                            <div className="info-row"><span>Mã người dùng</span><strong>#{currentUser.id}</strong></div>
                        </section>
                    )}

                    {/* Section Vouchers */}
                    {activeSection === 'vouchers' && (
                        <section className="profile-card">
                            <h3 className="section-title">Voucher của bạn</h3>
                            <div className="my-vouchers-list">
                                {myVouchers.length > 0 ? myVouchers.map(v => (
                                    <div key={v.id} className="my-voucher-item">
                                        <div className="v-left">
                                            <span className="v-code">{v.code}</span>
                                        </div>
                                        <div className="v-right">
                                            <h4 className="v-title">{v.title}</h4>
                                            <p className="v-desc">{v.description}</p>
                                            <div className="v-footer">
                                                <span>HSD: {new Date(v.expiredAt).toLocaleDateString('vi-VN')}</span>
                                                <button onClick={() => navigate('/products')} className="btn-use-now">Dùng ngay</button>
                                            </div>
                                        </div>
                                    </div>
                                )) : <p>Bạn chưa có voucher nào khả dụng.</p>}
                            </div>
                        </section>
                    )}

                    {/* Section Đơn hàng */}
                    {activeSection === 'orders' && (
                        <div className="profile-card">
                            <h3 className="section-title">Lịch sử đơn hàng</h3>
                            <OrderHistory currentUser={currentUser} />
                        </div>
                    )}

                    {/* Section Cập nhật Email */}
                    {activeSection === 'email' && (
                        <section className="profile-card">
                            <h3 className="section-title">Cập nhật Email</h3>
                            <form className="profile-form" onSubmit={handleUpdateEmail}>
                                <div className="form-group">
                                    <label>Email mới</label>
                                    <input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)} />
                                </div>
                                {emailError && <p className="form-error">{emailError}</p>}
                                {emailMessage && <p className="form-success">{emailMessage}</p>}
                                <button type="submit" className="btn-submit" disabled={emailLoading}>Lưu email</button>
                            </form>
                        </section>
                    )}

                    {/* Section Đổi mật khẩu */}
                    {activeSection === 'password' && (
                        <section className="profile-card">
                            <h3 className="section-title">Đổi mật khẩu</h3>
                            <form className="profile-form" onSubmit={handleUpdatePassword}>
                                <div className="form-group">
                                    <label>Mật khẩu mới</label>
                                    <input type="password" value={passwordValue} onChange={e => setPasswordValue(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Xác nhận mật khẩu</label>
                                    <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
                                </div>
                                {passwordError && <p className="form-error">{passwordError}</p>}
                                {passwordMessage && <p className="form-success">{passwordMessage}</p>}
                                <button type="submit" className="btn-submit" disabled={passwordLoading}>Lưu mật khẩu</button>
                            </form>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;