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
            <p className="subtitle">Quay ngay để nhận ưu đãi độc quyền</p>
            
            <div className="spin-info">
              <div className="spin-counter">
                <div className="counter-icon">🔄</div>
                <div className="counter-text">
                  <span className="count">{spinsLeft}</span>
                  <span className="label">lượt quay còn lại</span>
                </div>
              </div>
              <div className="spin-rule">
                <span className="rule-icon">📋</span>
                <span>1 lượt/quý cho thành viên VIP</span>
              </div>
            </div>
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
              <div className="pointer-circle"></div>
            </div>
            
            <div className="wheel-controls">
              {/* Hiển thị dòng thông báo nhỏ phía trên nút nếu cần */}
              {!currentUser && (
                <p className="status-msg warning">⚠️ Đăng nhập để nhận lượt quay free!</p>
              )}
              {currentUser && !canSpin && !spinning && (
                <p className="status-msg info">📅 Bạn đã hết lượt. Hẹn gặp lại ngày mai!</p>
              )}
              <button 
                onClick={spin} 
                disabled={spinning || spinsLeft <= 0}
                className="spin-button"
              >{!currentUser ? (
              "🔐 ĐĂNG NHẬP ĐỂ QUAY"
      )
                :spinning ? (
                  <>
                    <span className="spinner"></span>
                    <span>Đang quay...</span>
                  </>
                ) : spinsLeft <= 0 ? (
                  <>
                    <span className="icon">⏳</span>
                    <span>Đã hết lượt</span>
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
        </div>

        {/* Phần bên phải: Danh sách giải thưởng & Kết quả */}
        <div className="prize-section">
          {/* Kết quả nổi bật */}
          {result && showResult ? (
            <div className="result-highlight">
              <div className="highlight-header">
                <h3><span className="icon">🎉</span> Chúc mừng!</h3>
                <p>Bạn đã trúng giải thưởng</p>
              </div>
              
              <div 
                className="highlight-prize"
                style={{ 
                  background: `linear-gradient(135deg, ${result.color}22, ${result.color}44)`,
                  borderColor: result.color
                }}
              >
                <div className="prize-icon-large">{result.icon}</div>
                <div className="prize-info">
                  <h4 style={{ color: result.color }}>{result.name}</h4>
                  <p className="prize-description">{result.description}</p>
                  {result.value && (
                    <div className="prize-value">
                      <span>Giá trị:</span>
                      <strong>
                        {result.type === 'discount' ? ` ${result.value}%` : 
                         result.type === 'points' ? ` ${result.value} điểm` : 
                         ` ${result.value.toLocaleString()}đ`}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="highlight-actions">
                <button className="btn-primary" onClick={() => navigate('/products')}>
                  <span className="icon">🛒</span> Tiếp tục mua sắm
                </button>
                <button className="btn-secondary" onClick={() => navigate('/profile')}>
                  <span className="icon">📱</span> Xem voucher
                </button>
              </div>
              
              <div className="highlight-note">
                <p><span className="icon">✅</span> Quà đã được thêm vào tài khoản của bạn</p>
                <p className="small">Kiểm tra trong mục "Ưu đãi của tôi"</p>
              </div>
            </div>
          ) : (
            <div className="prize-list">
              <div className="list-header">
                <h3><span className="icon">🏆</span> Giải thưởng</h3>
                <p className="subtitle">Có thể nhận ngay sau khi quay</p>
              </div>
              
              <div className="prize-grid">
                {prizes.map(prize => (
                  <div 
                    key={prize.id} 
                    className={`prize-card ${highlightedPrize === prizes.indexOf(prize) ? 'highlighted' : ''}`}
                    style={{ 
                      borderColor: prize.color,
                      boxShadow: highlightedPrize === prizes.indexOf(prize) ? 
                        `0 0 20px ${prize.color}40` : 'none'
                    }}
                  >
                    <div className="card-header" style={{ background: prize.color }}>
                      <span className="prize-icon">{prize.icon}</span>
                      <h4 style={{ color: prize.textColor }}>{prize.name}</h4>
                    </div>
                    <div className="card-body">
                      <p className="prize-description">{prize.description}</p>
                      {prize.value && (
                        <div className="prize-value">
                          <span>Giá trị:</span>
                          <strong style={{ color: prize.color }}>
                            {prize.type === 'discount' ? ` ${prize.value}%` : 
                             prize.type === 'points' ? ` ${prize?.value}đ` : 
                             ` ${prize.value.toLocaleString()}đ`}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Thông tin thêm */}
          <div className="game-info">
            <div className="info-item">
              <span className="info-icon">📅</span>
              <div>
                <strong>Thời gian áp dụng:</strong>
                <p>Từ 01/01 đến 2026</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">👥</span>
              <div>
                <strong>Điều kiện tham gia:</strong>
                <p>Thành viên từ Level 1 trở lên</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">⚡</span>
              <div>
                <strong>Lưu ý:</strong>
                <p>Voucher có hiệu lực trong 30 ngày</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuckyWheel;