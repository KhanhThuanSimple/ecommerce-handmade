import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { getProducts } from '../services/ProductService';
import { User } from '../types/model';
import { useCart } from '../context/CartContext';
import { filterVouchersForUser } from '../untils/voucherUtils';
import { processOnlinePayment } from '../services/vnpayService';
import DeliveryInfo from './DeliveryInfo';
import '../Styles/checkout.css';
import { useNotify } from '../components/NotificationContext';

interface CheckoutProps {
  currentUser: User | null;
}

interface PaymentMethodConfig {
  code: string;
  name: string;
  isActive: boolean;
  logoUrl?: string;
  description?: string;
}

const Checkout: React.FC<CheckoutProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshCart } = useCart();
  const notify = useNotify();

  // States quản lý dữ liệu đơn hàng
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [finalTotal, setFinalTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('COD'); 
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethodConfig[]>([]);

  const buyNowItem = location.state?.buyNowItem;
  const selectedIds = location.state?.selectedIds || [];
  const rePayOrder = location.state?.rePayOrder;

  const payableTotal = Math.max(finalTotal - discount, 0);

  const validateCheckout = () => {
    const errors: any = {};
    if (!shippingDetails?.fullName?.trim()) errors.fullName = 'Vui lòng nhập họ và tên';
    if (!shippingDetails?.phone?.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)\d{9,10}$/.test(shippingDetails.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!shippingDetails?.detailAddress || !shippingDetails?.province) errors.address = 'Vui lòng nhập đầy đủ địa chỉ';
    if (!shippingDetails?.ward) errors.ward = 'Vui lòng nhập phường/xã';
    if (!shippingDetails?.district) errors.district = 'Vui lòng nhập quận/huyện';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (shippingDetails && !rePayOrder && currentUser?.id) {
      localStorage.setItem(`shipping_${currentUser.id}`, JSON.stringify(shippingDetails));
    }
  }, [shippingDetails, currentUser?.id, rePayOrder]);

  useEffect(() => {
    const fetchActivePaymentMethods = async () => {
      try {
        const res = await api.get('/payment/methods');
        setAvailableMethods(res.data || []);
        if (res.data && res.data.length > 0) {
          setPaymentMethod(res.data[0].code);
        }
      } catch (err) {
        console.error('Không thể lấy danh sách phương thức thanh toán:', err);
        setAvailableMethods([
          { code: 'COD', name: 'Thanh toán khi nhận hàng', logoUrl: 'https://cdn-icons-png.flaticon.com/512/6491/6491490.png', description: 'Giao hàng tận nơi, kiểm tra trước khi thanh toán', isActive: true },
          { code: 'VNPAY', name: 'Cổng thanh toán VNPay', logoUrl: 'https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAY-QR-1.png', description: 'Thanh toán qua thẻ ATM, Visa, Mastercard, QR code', isActive: true }
        ]);
      }
    };
    fetchActivePaymentMethods();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadCheckoutData = async () => {
      setLoading(true);
      try {
        if (rePayOrder) {
          setDisplayItems(rePayOrder.items);
          setFinalTotal(rePayOrder.totalAmount);
          setPaymentMethod(rePayOrder.paymentMethod?.toUpperCase() || 'COD');
        } else if (buyNowItem?.id) {
          setDisplayItems([{ product: buyNowItem, quantity: 1 }]);
          setFinalTotal(Number(buyNowItem.price));
        } else if (selectedIds.length > 0) {
          const [allProducts, cartRes] = await Promise.all([
            getProducts(),
            api.get(`/carts?userId=${currentUser.id}`)
          ]);
          const cartItems = cartRes.data || [];
          const itemsToPay = cartItems
            .filter((item: any) => selectedIds.includes(item.productId))
            .map((item: any) => ({
              product: allProducts.find((p: any) => p.id === item.productId),
              quantity: item.quantity
            }))
            .filter((i: any) => i.product);
          
          if (itemsToPay.length > 0) {
            setDisplayItems(itemsToPay);
            setFinalTotal(itemsToPay.reduce((sum: number, i: any) => sum + (i.product.price * i.quantity), 0));
          } else {
            navigate('/cart');
          }
        } else {
          navigate('/home');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        notify.error('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [currentUser, buyNowItem, selectedIds.length, rePayOrder, navigate]);

  useEffect(() => {
    const loadVouchers = async () => {
  if (!currentUser || finalTotal <= 0) return;
  
  try {
    // 1. Gọi lấy danh sách voucher (Public)
    const vouchersRes = await api.get('/voucher');
    
    // 2. Gọi lấy đơn hàng (Private - có thể lỗi nếu token hết hạn)
    let ordersData = [];
    try {
      const ordersRes = await api.get(`/orders?userId=${currentUser.id}`);
      ordersData = ordersRes.data;
    } catch (orderErr) {
      console.warn("Không lấy được lịch sử đơn hàng, chỉ hiển thị voucher công khai.");
    }

    // 3. Lọc voucher an toàn
    const filtered = filterVouchersForUser(vouchersRes.data, ordersData, finalTotal);
    setVouchers(filtered);

    // 4. Áp dụng tự động
    if (filtered.length > 0 && !selectedVoucher) {
      applyBestVoucher(filtered[0]);
    } else if (selectedVoucher && !filtered.some(v => v.id === selectedVoucher.id)) {
      setSelectedVoucher(null);
      setDiscount(0);
    }
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu voucher:', err);
  }
};
    loadVouchers();
  }, [finalTotal, currentUser]);

  const applyBestVoucher = (voucher: any) => {
    let discountValue = voucher.type === 'PERCENT'
      ? Math.floor((finalTotal * voucher.value) / 100)
      : voucher.value;
    if (voucher.maxDiscount) {
      discountValue = Math.min(discountValue, voucher.maxDiscount);
    }
    setSelectedVoucher(voucher);
    setDiscount(discountValue);
  };

  const applyVoucher = (voucher: any) => {
    if (selectedVoucher?.id === voucher.id) {
      setSelectedVoucher(null);
      setDiscount(0);
      notify.success('Đã huỷ áp dụng mã giảm giá');
      return;
    }
    
    let discountValue = voucher.type === 'PERCENT'
      ? Math.floor((finalTotal * voucher.value) / 100)
      : voucher.value;
    
    if (voucher.maxDiscount) {
      discountValue = Math.min(discountValue, voucher.maxDiscount);
    }
    
    setSelectedVoucher(voucher);
    setDiscount(discountValue);
    notify.success(`Đã áp dụng mã ${voucher.code}`);
  };

  const prepareOrderData = (status: string) => {
    const address = shippingDetails?.isFromOldOrder
      ? shippingDetails.address
      : `${shippingDetails?.detailAddress}, ${shippingDetails?.ward}, ${shippingDetails?.district}, ${shippingDetails?.province}`;
    
    return {
      userId: currentUser?.id,
      fullName: shippingDetails?.fullName || '',
      customerEmail: currentUser?.email || '',
      phone: shippingDetails?.phone || '',
      address: address,
      items: displayItems.map((item: any) => ({
        productId: item.product?.id || item.productId,
        quantity: item.quantity
      })),
      totalAmount: finalTotal,
      discountAmount: discount,
      payableAmount: payableTotal,
      voucherCode: selectedVoucher?.code || null,
      paymentMethod: paymentMethod.toUpperCase(),
      status: status,
      date: rePayOrder ? rePayOrder.date : new Date().toLocaleString('vi-VN'),
      ...(rePayOrder && { id: rePayOrder.id })
    };
  };

  const handleConfirmOrder = async () => {
    // 1. Kiểm tra xác thực ngay tại Client
   const userStr = localStorage.getItem('user');
const token = userStr ? JSON.parse(userStr).token : null;
    
    if (!currentUser || !token) {
        notify.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
    }

    if (!rePayOrder && !validateCheckout()) {
        notify.warning('Vui lòng kiểm tra lại thông tin giao hàng');
        return;
    }

    const isVNPay = paymentMethod.toUpperCase() === 'VNPAY';
    const orderData = prepareOrderData(isVNPay ? 'Chờ thanh toán' : 'Thanh toán khi nhận hàng');

    try {
        setProcessingOrder(true);
        
        // 2. Gọi API với xử lý kết quả an toàn
        let orderRes;
        if (rePayOrder) {
            orderRes = await api.put(`/orders/${rePayOrder.id}`, orderData);
        } else {
            orderRes = await api.post('/orders', orderData);
        }

        // Kiểm tra xem API có trả về dữ liệu đơn hàng không
        if (!orderRes || !orderRes.data) {
            throw new Error('Hệ thống không phản hồi thông tin đơn hàng.');
        }

        const orderId = orderRes.data.id;
        
        if (!isVNPay) {
            await refreshCart();
            notify.success('Đặt hàng thành công!');
            navigate('/order-history');
        } else {
            // 3. Thanh toán VNPay - Kiểm tra URL trước khi redirect
            try {
                const paymentUrl = await processOnlinePayment({
                    orderId: orderId,
                    amount: payableTotal, // Dùng biến đã tính toán
                    paymentMethod: 'VNPAY'
                });

                if (paymentUrl && typeof paymentUrl === 'string' && paymentUrl.startsWith('http')) {
                    window.location.href = paymentUrl;
                } else {
                    throw new Error('Link thanh toán không hợp lệ.');
                }
            } catch (paymentErr: any) {
                console.error('Lỗi gọi cổng VNPay:', paymentErr);
                notify.error('Không thể kết nối đến cổng thanh toán.');
            }
        }
    } catch (err: any) {
        // 4. Xử lý lỗi tập trung
        console.error('Chi tiết lỗi:', err);
        const status = err.response?.status;
        if (status === 401) {
            notify.error('Phiên đăng nhập hết hạn.');
            navigate('/login');
        } else {
            notify.error(err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại sau.');
        }
    } finally {
        setProcessingOrder(false);
    }
};

  if (loading) return <div className="loading">Đang tải thông tin đơn hàng...</div>;

  const savedShippingData = localStorage.getItem(`shipping_${currentUser?.id}`)
    ? JSON.parse(localStorage.getItem(`shipping_${currentUser?.id}`)!)
    : rePayOrder;

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Thanh toán đơn hàng</h1>
        <p className="checkout-subtitle">Vui lòng kiểm tra thông tin trước khi đặt hàng</p>
      </div>

      <div className="checkout-grid">
        {/* CỘT TRÁI: Form thông tin nhận hàng & Giỏ hàng thu gọn */}
        <div className="checkout-left">
          
          {/* Form Thông Tin Nhận Hàng chuyên nghiệp */}
          <div className="checkout-card delivery-card">
            <div className="card-header">
              <span className="icon">🚚</span>
              <h3>Thông tin nhận hàng</h3>
            </div>
            <DeliveryInfo
              initialData={savedShippingData}
              onAddressChange={setShippingDetails}
              errors={formErrors}
            />
          </div>

          {/* Danh Sách Sản Phẩm - Giới hạn hiển thị và tự cuộn */}
          <div className="checkout-card products-card">
            <div className="card-header">
              <span className="icon">📦</span>
              <h3>Sản phẩm <span>({displayItems.length} mặt hàng)</span></h3>
            </div>
            <div className="product-list">
              {displayItems.map((item, idx) => (
                <div key={idx} className="checkout-product-item">
                  <img
                    src={item.product?.imageUrl || item.productImageUrl || 'https://via.placeholder.com/80'}
                    alt={item.product?.name || item.productName}
                  />
                  <div className="product-details">
                    <div className="product-name">
                      <span>{item.product?.name || item.productName}</span>
                      <span className="product-price">
                        ₫{(item.product?.price || item.productPrice).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="product-quantity">Số lượng: {item.quantity}</div>
                  </div>
                  <div className="item-subtotal">
                    ₫{((item.product?.price || item.productPrice) * item.quantity).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Khối "Tất cả trong một" (Sticky Summary) */}
        <div className="checkout-right">
          <div className="summary-sticky">
            <div className="total-card-integrated">
              
              {/* Phân đoạn 1: Phương thức thanh toán */}
              <div className="inner-section">
                <div className="inner-section-title">Phương thức thanh toán</div>
                <div className="payment-methods-grid">
                  {availableMethods.map((method) => (
                    <div
                      key={method.code}
                      className={`method-box ${paymentMethod === method.code ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.code)}
                    >
                      <input
                        type="radio"
                        name="payment_option"
                        checked={paymentMethod === method.code}
                        onChange={() => setPaymentMethod(method.code)}
                      />
                      <img 
                        src={method.logoUrl || 'https://via.placeholder.com/40'} 
                        alt={method.name} 
                        className="method-logo" 
                      />
                      <div className="method-info">
                        <span className="method-title">{method.name}</span>
                        <span className="method-desc">{method.description || 'Thanh toán bảo mật'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-divider"></div>

              {/* Phân đoạn 2: Mã Giảm Giá (Chỉ hiện nếu tồn tại voucher phù hợp) */}
              {vouchers.length > 0 && (
                <>
                  <div className="inner-section">
                    <div className="inner-section-title">Mã giảm giá áp dụng</div>
                    <div className="voucher-list">
                      {vouchers.map((v) => (
                        <div
                          key={v.id}
                          className={`voucher-item ${selectedVoucher?.id === v.id ? 'active' : ''}`}
                          onClick={() => applyVoucher(v)}
                        >
                          <div className="voucher-info">
                            <span className="voucher-code">{v.code}</span>
                            <span className="voucher-name">{v.title || v.description}</span>
                          </div>
                          <div className="voucher-value">
                            {v.type === 'PERCENT' ? `-${v.value}%` : `-${(v.value / 1000).toFixed(0)}k`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="section-divider"></div>
                </>
              )}

              {/* Phân đoạn 3: Bảng Tính Toán Giá Tiền */}
              <div className="checkout-total">
                <div className="total-row">
                  <span>Tạm tính</span>
                  <span>{finalTotal.toLocaleString('vi-VN')}₫</span>
                </div>
                {discount > 0 && (
                  <div className="total-row discount">
                    <span>Mã giảm giá</span>
                    <span>-{discount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="total-divider"></div>
                <div className="total-row final">
                  <span>Tổng thanh toán</span>
                  <span>{payableTotal.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              {/* Phân đoạn 4: Hệ thống Nút Hành Động */}
              <div className="checkout-actions">
                <button 
                  className="btn-order-confirm" 
                  onClick={handleConfirmOrder}
                  disabled={processingOrder}
                >
                  {processingOrder ? (
                    <>
                      <span className="spinner"></span>
                      Đang xử lý đơn hàng...
                    </>
                  ) : (
                    <>Xác nhận đặt mua</>
                  )}
                </button>
                <button 
                  className="btn-order-cancel" 
                  onClick={() => navigate('/cart')}
                  disabled={processingOrder}
                >
                  Quay lại giỏ hàng
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;