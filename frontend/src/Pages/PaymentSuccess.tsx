import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

    useEffect(() => {
        const responseCode = searchParams.get('vnp_ResponseCode');
        // Logic xác thực thật sự nên gọi API tại đây
        if (responseCode === '00') {
            setStatus('success');
        } else {
            setStatus('failed');
        }
    }, [searchParams]);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {status === 'loading' && <h2>Đang xác thực giao dịch...</h2>}
                
                {status === 'success' && (
                    <>
                        <div style={{ ...styles.icon, color: '#27ae60' }}>✓</div>
                        <h1 style={styles.title}>Thanh toán thành công!</h1>
                        <p style={styles.text}>Cảm ơn bạn đã mua hàng tại Handmade Shop.</p>
                        <div style={styles.buttonGroup}>
                            <button style={styles.btnHome} onClick={() => navigate('/')}>Về trang chủ</button>
                            <button style={styles.btnOrder} onClick={() => navigate('/orders')}>Xem đơn hàng</button>
                        </div>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div style={{ ...styles.icon, color: '#e74c3c' }}>✕</div>
                        <h1 style={styles.title}>Thanh toán thất bại!</h1>
                        <p style={styles.text}>Đã có lỗi xảy ra trong quá trình xử lý giao dịch.</p>
                        <button style={styles.btnHome} onClick={() => navigate('/')}>Quay lại trang chủ</button>
                    </>
                )}
            </div>
        </div>
    );
};

// CSS-in-JS đơn giản để bạn dễ tùy chỉnh
const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' },
    card: { background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' },
    icon: { fontSize: '60px', marginBottom: '20px', fontWeight: 'bold' },
    title: { fontSize: '24px', marginBottom: '10px', color: '#333' },
    text: { color: '#666', marginBottom: '30px' },
    buttonGroup: { display: 'flex', gap: '10px', justifyContent: 'center' },
    btnHome: { padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#f1f1f1' },
    btnOrder: { padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#3498db', color: '#fff' }
};

export default PaymentSuccess;