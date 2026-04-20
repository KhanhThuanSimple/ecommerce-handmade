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
                    // Nếu đã đăng nhập: Sắp xếp theo viewCount & Rating
                    return calculateMemberScore(b) - calculateMemberScore(a);
                } else {
                    // Nếu là khách: Sắp xếp theo Inventory & Comments
                    return calculateNewUserScore(b) - calculateNewUserScore(a);
                }
            })
            .slice(0, 6); // Lấy top 6 sản phẩm phù hợp nhất
    }, [products, currentUser]);

    // Tiêu đề động dựa trên đối tượng
    const sectionTitle = currentUser?.id 
        ? "Gợi Ý Riêng Cho Bạn" 
        : "Sản Phẩm Bán Chạy Nhất";

 const tetDate = new Date('2026-02-17T00:00:00'); 
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(tetDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeRemaining(tetDate));
        }, 1000);

        return () => clearInterval(timer);
    }, []);
    return (
        <div className="home-container">
            {/* HERO BANNER Tết Bính Ngọ */}
            <section className="hero-banner">
                <div className="hero-overlay"></div>
                <div className="horse-decoration">
                    <div className="horse-silhouette"></div>
                    <div className="horse-silhouette reverse"></div>
                </div>
                <div className="firework firework-1"></div>
                <div className="firework firework-2"></div>
                <div className="firework firework-3"></div>
                
                <div className="hero-content">
                    <span className="hero-subtitle">Chào Xuân Bính Ngọ 2026</span>
                    <h1>Mã Đáo Thành Công<br />An Khang Thịnh Vượng</h1>
                    <p>Đón năm Ngựa vàng với bộ sưu tập gốm sứ cao cấp - Biểu tượng của sự sung túc, bền vững và thành công vượt bậc</p>
                                            <div className="hero-actions">
                        {/* Chuyển onClick ra thẻ button */}
                        <button className="btn-white" onClick={() => navigate('/products')}>
                            <span className="btn-gold-icon">🐎</span> Khám Phá Ngay
                        </button>

                        <button className="btn-white" onClick={() => navigate('/games')}>
                            <span className="btn-gold-icon">💰</span> Vòng quay may mắn
                        </button>
</div>
                </div>
                               <div className="countdown-tet">
                <h4>Đếm ngược đến Giao Thừa</h4>

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
                    <div className="lantern lantern-left"></div>
                    <div className="lantern lantern-right"></div>
                    <div className="spring-flower spring-flower-1">🌸</div>
                    <div className="spring-flower spring-flower-2">🏵️</div>
                </div>
            </section>

            {/* SERVICE FEATURES với chủ đề Tết */}
            <section className="service-features">
                <div className="feature-item">
                    <div className="icon">🎁</div>
                    <h3>Quà Tết Cao Cấp</h3>
                    <p>Hộp quà Tết sang trọng, bọc lụa đỏ vàng, phù hợp biếu tặng đối tác, người thân</p>
                </div>
                <div className="feature-item">
                    <div className="icon">🚚</div>
                    <h3>Giao Hàng Tết</h3>
                    <p>Miễn phí giao hàng toàn quốc đơn từ 1.5 triệu, đảm bảo nhận hàng trước 30 Tết</p>
                </div>
                <div className="feature-item">
                    <div className="icon">🎨</div>
                    <h3>Thiết Kế Độc Quyền</h3>
                    <p>Họa tiết ngựa phong thủy, chữ Tết thư pháp độc bản, mang may mắn cả năm</p>
                </div>
                <div className="feature-item">
                    <div className="icon">💝</div>
                    <h3>Bảo Hành Trọn Đời</h3>
                    <p>Cam kết chất lượng, đổi trả trong 7 ngày, bảo hành sản phẩm trọn đời</p>
                </div>
            </section>

            {/* FEATURED PRODUCTS - Tết Bính Ngọ */}
            <section className="featured-section">
                <div className="section-header">
                    <div className="horse-heading-decoration">
                        <span className="horse-head">🐎</span>
                        <h2>Sản Phẩm Đang Được Săn Đón</h2>
                        <span className="horse-head reverse">🐎</span>
                        
                    </div>
                    <p>Bộ sưu tập giới hạn "Mã Đáo Thành Công" - Thiết kế riêng cho năm Ngựa vàng 2026</p>
                    <div className="chinese-character">馬</div>
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
                        <span className="btn-horse-icon">🏇</span> Xem Tất Cả Sản Phẩm Tết
                    </Link>
                </div>
            </section>

           
            
            {/* Tết Traditions Section */}
            <section className="tet-traditions">
                <div className="tradition-content">
                   
                    <div className="tradition-icons">
                        <div className="tradition-icon-item">
                            <div className="icon-circle">🌺</div>
                            <span>Mai Vàng</span>
                        </div>
                        <div className="tradition-icon-item">
                            <div className="icon-circle">🍊</div>
                            <span>Quất Cảnh</span>
                        </div>
                        <div className="tradition-icon-item">
                            <div className="icon-circle">📜</div>
                            <span>Thư Pháp</span>
                        </div>
                        <div className="tradition-icon-item">
                            <div className="icon-circle">🏮</div>
                            <span>Đèn Lồng</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;