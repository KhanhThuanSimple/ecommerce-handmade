import React, { useMemo,useState,useEffect } from 'react';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/model';
import { useProducts, getTimeRemaining,calculateNewUserScore,calculateMemberScore} from '../hooks/useProducts';
import '../Styles/home.css'; 
import '../Styles/layout.css'; 

import { Link } from 'react-router-dom';
import { useProductFeatures } from '../hooks/useProductFeatures';

const Home: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    const { products, loading, error } = useProducts();
      const navigate = useNavigate();
   const displayProducts = useMemo(() => {
        if (!products || products.length === 0) return [];

        const isLogged = currentUser && currentUser.id;

        return [...products]
            .filter(p => p.inventory > 0)
            .sort((a, b) => {
                if (isLogged) {
                    return calculateMemberScore(b) - calculateMemberScore(a);
                } else {
                    return calculateNewUserScore(b) - calculateNewUserScore(a);
                }
            })
            .slice(0, 6);
    }, [products, currentUser]);

    const sectionTitle = currentUser?.id 
        ? "Gợi Ý Riêng Cho Bạn" 
        : "Sản Phẩm Bán Chạy Nhất";

    // Tết Trung Thu năm 2026: 25/09/2026
    const midAutumnDate = new Date('2026-09-25T00:00:00'); 
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(midAutumnDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeRemaining(midAutumnDate));
        }, 1000);

        return () => clearInterval(timer);
    }, []);
    return (
        <div className="home-container">
            {/* HERO BANNER Tết Trung Thu */}
            <section className="hero-banner">
                <div className="hero-overlay"></div>
                <div className="mid-autumn-decoration">
                    <div className="rabbit-silhouette"></div>
                    <div className="moon-silhouette">🌕</div>
                </div>
                <div className="lantern firework-1">🏮</div>
                <div className="lantern firework-2">🏮</div>
                <div className="lantern firework-3">🏮</div>
                
                <div className="hero-content">
                    <span className="hero-subtitle">Mùa Trăng Yêu Thương 2026</span>
                    <h1>Vui Tết Trung Thu<br />Đón Trăng Đoàn Viên</h1>
                    <p>Đón Tết Trung Thu với bộ sưu tập quà tặng cao cấp - Gửi gắm lời chúc bình an, sum vầy và hạnh phúc trọn vẹn</p>
                    <div className="hero-actions">
                        <button className="btn-white" onClick={() => navigate('/products')}>
                            <span className="btn-gold-icon">🥮</span> Khám Phá Ngay
                        </button>

                        <button className="btn-white" onClick={() => navigate('/games')}>
                            <span className="btn-gold-icon">🎁</span> Vòng quay may mắn
                        </button>
                    </div>
                </div>
                <div className="countdown-tet">
                    <h4>Đếm ngược đến Rằm Trung Thu</h4>
                    <div className="countdown-timer">
                        <div className="countdown-item">
                            <span className="countdown-number">{timeLeft.days}</span>
                            <span className="countdown-label">Ngày</span>
                        </div>
                        <div className="countdown-separator">:</div>
                        <div className="countdown-item">
                            <span className="countdown-number">{timeLeft.hours}</span>
                            <span className="countdown-label">Giờ</span>
                        </div>
                        <div className="countdown-separator">:</div>
                        <div className="countdown-item">
                            <span className="countdown-number">{timeLeft.minutes}</span>
                            <span className="countdown-label">Phút</span>
                        </div>
                        <div className="countdown-separator">:</div>
                        <div className="countdown-item">
                            <span className="countdown-number">{timeLeft.seconds}</span>
                            <span className="countdown-label">Giây</span>
                        </div>
                    </div>
                </div>

                <div className="tet-decoration">
                    <div className="lantern lantern-left">🏮</div>
                    <div className="lantern lantern-right">🏮</div>
                    <div className="spring-flower spring-flower-1">✨</div>
                    <div className="spring-flower spring-flower-2">🐇</div>
                </div>
            </section>

            {/* SERVICE FEATURES với chủ đề Trung Thu */}
            <section className="service-features">
                <div className="feature-item">
                    <div className="icon">🥮</div>
                    <h3>Quà Trung Thu Cao Cấp</h3>
                    <p>Hộp quà bánh Trung Thu sang trọng, hoa văn mạ vàng, phù hợp biếu tặng đối tác, người thân</p>
                </div>
                <div className="feature-item">
                    <div className="icon">🚚</div>
                    <h3>Giao Hàng Tốc Độ</h3>
                    <p>Miễn phí giao hàng toàn quốc đơn từ 1.5 triệu, đảm bảo nhận hàng trước đêm Rằm</p>
                </div>
                <div className="feature-item">
                    <div className="icon">🎨</div>
                    <h3>Thiết Kế Độc Quyền</h3>
                    <p>Họa tiết Thỏ Ngọc, Trăng Rằm độc bản, mang ý nghĩa sum vầy, đoàn viên</p>
                </div>
                <div className="feature-item">
                    <div className="icon">💝</div>
                    <h3>Bảo Hành Trọn Đời</h3>
                    <p>Cam kết chất lượng, đổi trả trong 7 ngày, bảo hành sản phẩm trọn đời</p>
                </div>
            </section>

            {/* FEATURED PRODUCTS - Tết Trung Thu */}
            <section className="featured-section">
                <div className="section-header">
                    <div className="horse-heading-decoration">
                        <span className="horse-head">🐰</span>
                        <h2>Sản Phẩm Đang Được Săn Đón</h2>
                        <span className="horse-head reverse">🐰</span>
                    </div>
                    <p>Bộ sưu tập giới hạn "Trăng Rằm Tỏa Sáng" - Thiết kế riêng cho mùa Thu 2026</p>
                    <div className="chinese-character">秋</div>
                </div>
                
                <div className="product-grid-limited">
                   {displayProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                currentUser={currentUser}
                            />
                        ))}
                </div>
                
                <div className="view-more-container">
                    <Link to="/products" className="btn-view-all">
                        <span className="btn-horse-icon">🏮</span> Xem Tất Cả Quà Tặng
                    </Link>
                </div>
            </section>

            {/* Trung Thu Traditions Section */}
            <section className="tet-traditions">
                <div className="tradition-content">
                    <div className="tradition-icons">
                        <div className="tradition-icon-item">
                            <div className="icon-circle">🥮</div>
                            <span>Bánh Nướng</span>
                        </div>
                        <div className="tradition-icon-item">
                            <div className="icon-circle">🌕</div>
                            <span>Ngắm Trăng</span>
                        </div>
                        <div className="tradition-icon-item">
                            <div className="icon-circle">🐰</div>
                            <span>Thỏ Ngọc</span>
                        </div>
                        <div className="tradition-icon-item">
                            <div className="icon-circle">🏮</div>
                            <span>Rước Đèn</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;