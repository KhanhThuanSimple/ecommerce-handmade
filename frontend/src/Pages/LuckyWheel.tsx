import React, { useRef, useEffect, useCallback } from 'react';
import { useLuckyWheel } from '../hooks/useLuckyWheel';
import '../Styles/LuckyWheel.css';
import { User } from '../types/model';
import { useNavigate } from 'react-router-dom';

interface LuckyWheelProps {
  currentUser: User | null;
  onLogout: () => void;
}

const LuckyWheel: React.FC<LuckyWheelProps> = ({ currentUser }) => {
  // 1. Khai báo Ref và các thông số kích thước (Phải nằm trong hàm)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 320;
  const center = size / 2;
  const radius = size / 2 - 10;
  const navigate = useNavigate();


  // 2. Gọi Hook (Phải nằm trong hàm và nhận currentUser từ Props)
  const {
    prizes,
    angle,
    spinning,
    result,
    spinsLeft,
    showResult,
    highlightedPrize,
    loading,
    slice,
    spin,
    closeResult,
    canSpin
  } = useLuckyWheel(currentUser);

  // 3. Logic vẽ Canvas (Nằm trong hàm để truy cập được các biến trên)
  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, rotation: number) => {
    if (prizes.length === 0) return;
    ctx.clearRect(0, 0, size, size);

    // Vẽ nền trắng
    ctx.beginPath();
    ctx.arc(center, center, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 3;
    ctx.stroke();
    prizes.forEach((prize, i) => {
      const start = i * slice + rotation;
      const end = start + slice;
      const isHighlighted = highlightedPrize === i;

      // Vẽ Sector
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, isHighlighted ? radius + 3 : radius, start, end);
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = isHighlighted ? 3 : 1;
      ctx.stroke();

      // Vẽ Nội dung (Icon & Tên)
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = prize.textColor;
      
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(prize.icon, radius - 50, 0);
      
      ctx.font = '600 14px sans-serif';
      ctx.fillText(prize.name, radius - 50, 20);

      if (prize.value) {
        ctx.font = 'bold 14px sans-serif';
        const displayValue = prize.type === 'discount' ? `${prize.value}%` : `${prize.value}đ`;
        ctx.fillText(displayValue, radius - 50, 40);
      }
      ctx.restore();
    });

    // Logo tâm vòng quay
    ctx.beginPath();
    ctx.arc(center, center, 40, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#4F46E5';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QUAY', center, center + 5);
  }, [prizes, slice, highlightedPrize]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawWheel(ctx, angle);
  }, [angle, drawWheel]);

  if (loading) return <div className="loading-spinner">Đang tải dữ liệu...</div>;

  return (
    <div className="lucky-wheel-game">
      <div className="wheel-container">
        {/* Phần bên trái: Vòng quay */}
        <div className="wheel-section">
          <div className="wheel-header">
            <h2><span className="icon">🎡</span> Vòng Quay May Mắn</h2>
            <p className="subtitle">Quay ngay để nhận ưu đãi độc quyền hôm nay</p>
          </div>

          <div className="wheel-box">
            <canvas 
              ref={canvasRef} 
              width={size} 
              height={size}
              className={spinning ? 'spinning' : ''}
            />
            
            <div className="pointer-container">
              <div className="pointer-triangle"></div>
            </div>
          </div>

          <div className="wheel-controls">
            {!currentUser && (
              <p className="status-msg warning">⚠️ Đăng nhập để quay miễn phí mỗi ngày!</p>
            )}
            {currentUser && !canSpin && !spinning && (
              <p className="status-msg info">📅 Bạn đã quay hôm nay. Hẹn gặp lại ngày mai!</p>
            )}
            {currentUser && canSpin && !spinning && (
              <p className="status-msg info">🎉 Bạn có 1 lượt quay miễn phí mỗi ngày!</p>
            )}
            <button 
              onClick={() => {
                if (!currentUser) {
                  navigate('/login');
                } else {
                  spin();
                }
              }} 
              disabled={spinning || (currentUser !== null && spinsLeft <= 0)}
              className="spin-button"
            >
              {!currentUser ? (
                "🔐 ĐĂNG NHẬP ĐỂ QUAY"
              ) : spinning ? (
                <>
                  <span className="spinner"></span>
                  <span>Đang quay...</span>
                </>
              ) : spinsLeft <= 0 ? (
                <>
                  <span className="icon">⏳</span>
                  <span>Hết lượt hôm nay</span>
                </>
              ) : (
                <>
                  <span className="icon">🎯</span>
                  <span>QUAY NGAY</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Phần bên phải: Danh sách giải thưởng */}
        <div className="prize-section">
          <div className="prize-list">
            <div className="list-header">
              <h3><span className="icon">🏆</span> Cơ cấu giải thưởng</h3>
              <p className="subtitle">Danh sách quà tặng có thể nhận được</p>
            </div>
            
            <div className="prize-grid">
              {prizes.map((prize, index) => (
                <div 
                  key={prize.id} 
                  className={`prize-card ${highlightedPrize === index ? 'highlighted' : ''}`}
                  style={{
                    borderLeft: `4px solid ${prize.color}`
                  }}
                >
                  <div className="prize-icon">{prize.icon}</div>
                  <div className="prize-card-info">
                    <h4>{prize.name}</h4>
                    <p>{prize.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="game-info">
              <div className="info-item">
                <span className="info-icon">🎁</span>
                <strong>Mỗi ngày 1 lượt</strong>
              </div>
              <div className="info-item">
                <span className="info-icon">⚡</span>
                <strong>100% trúng thưởng</strong>
              </div>
              <div className="info-item">
                <span className="info-icon">📅</span>
                <strong>Voucher cá nhân</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Kết Quả (Popup style Shopee/Lazada) */}
      {result && showResult && (
        <div className="lucky-modal-overlay">
          <div className="lucky-modal-content">
            <div className="lucky-modal-header">
              <h3><span className="icon">🎉</span> Chúc mừng bạn!</h3>
              <button className="lucky-modal-close" onClick={closeResult}>&times;</button>
            </div>
            <div className="lucky-modal-body">
              <div className="prize-icon-huge">{result.icon}</div>
              <h4>{result.name}</h4>
              <p className="prize-description">{result.description}</p>
              
              <div className="highlight-note">
                {result.type === 'points' ? 'Điểm đã được cộng vào tài khoản của bạn.' : 'Voucher đã được thêm vào "Voucher của tôi" và chỉ dành riêng cho bạn.'}
              </div>
            </div>
            <div className="lucky-modal-footer">
              <button className="btn-primary" onClick={() => navigate('/')}>
                <span className="icon">🛒</span> Tiếp tục mua sắm
              </button>
              {result.type !== 'points' && (
                <button className="btn-secondary" onClick={() => navigate('/profile')}>
                  <span className="icon">🎟️</span> Xem voucher của tôi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyWheel;