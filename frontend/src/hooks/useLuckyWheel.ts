import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { Prize, User } from '../types/model';
import { useNotify } from '../components/NotificationContext';
import api from '../services/api';

export const useLuckyWheel = (currentUser: User | null) => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [highlightedPrize, setHighlightedPrize] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSpin, setCanSpin] = useState(false);
const notify = useNotify();
  useEffect(() => {
    api.get('/prizes')
      .then(res => {
        setPrizes(Array.isArray(res.data) ? res.data : res.data.prizes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (currentUser) {
      const today = new Date().toDateString();
      const lastSpin = currentUser.lastSpinDate ? new Date(currentUser.lastSpinDate).toDateString() : "";
      setCanSpin(today !== lastSpin);
    } else {
      setCanSpin(false);
    }
  }, [currentUser]);

  const slice = useMemo(() => (prizes.length > 0 ? (2 * Math.PI) / prizes.length : 0), [prizes]);

  const spin = useCallback(async () => {
    
    if (spinning || !canSpin || prizes.length === 0 || !currentUser) return;

    setSpinning(true);
    setResult(null);
    setHighlightedPrize(null);

    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[prizeIndex];
    const targetRotation = 5 * 2 * Math.PI + (prizes.length - prizeIndex) * slice - slice / 2;
    const finalAngle = angle + targetRotation;

    let startTime: number | null = null;
    const duration = 4000;
    const initialAngle = angle;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAngle(initialAngle + (finalAngle - initialAngle) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(async () => {
  setResult(selectedPrize);
  setShowResult(true);
  setHighlightedPrize(prizeIndex);
  setSpinning(false);
  setCanSpin(false);

  try {
    const now = new Date();
    const expiredDate = new Date();
    expiredDate.setMonth(now.getMonth() + 1); // Voucher có hạn 1 tháng

    // 1. Cập nhật ngày quay của User để khóa lượt quay
    await api.patch(`/users/${currentUser.id}`, {
      lastSpinDate: now.toISOString()
    });

    // 2. Nếu trúng Voucher hoặc Discount, tạo bản ghi Voucher mới
    if (selectedPrize.type === 'voucher' || selectedPrize.type === 'discount') {
      
      const newVoucher = {
        id: `VC_LUCKY_${Date.now()}`, // Tạo ID duy nhất
        code: `LUCKY${Math.random().toString(36).toUpperCase().substring(2, 7)}`,
        title: selectedPrize.name,
        description: selectedPrize.description || "Phần thưởng từ Vòng quay may mắn",
        // Ánh xạ kiểu: nếu prize là discount -> PERCENT, nếu là voucher -> FIXED
        type: selectedPrize.type === 'discount' ? "PERCENT" : "FIXED",
        value: selectedPrize.value || 0,
        maxDiscount: selectedPrize.type === 'discount' ? 50000 : selectedPrize.value,
        minOrder: 0, // Vòng quay thường cho voucher không giới hạn đơn tối thiểu hoặc tùy chỉnh theo prize
        target: "SPECIFIC_USER", // Đánh dấu đây là voucher dành riêng
        userId: currentUser.id,   // QUAN TRỌNG: Gán ID user để filter ở trang cá nhân
        maxOrderCount: 0,
        quantity: 1,
        used: 0,
        status: "ACTIVE",
        startDate: now.toISOString().split('T')[0], // Định dạng YYYY-MM-DD
        expiredAt: expiredDate.toISOString().split('T')[0]
      };

      await api.post('/voucher', newVoucher);
      notify.success("Đã lưu voucher độc quyền cho user!");
    }

    // 3. Nếu trúng Points (Xu/Điểm)
    if (selectedPrize.type === 'points') {
      const currentPoints = (currentUser as any).points || 0;
      await api.patch(`/users/${currentUser.id}`, {
        points: currentPoints + (selectedPrize.value || 0)
      });
    }

  } catch (e) {
    console.error("Lỗi xử lý phần thưởng:", e);
  }
}, 300);
      }
    };
    requestAnimationFrame(animate);
  }, [spinning, canSpin, currentUser, prizes, angle, slice]);

  return {
    prizes, angle, spinning, result, showResult, 
    highlightedPrize, loading, canSpin, slice, 
    spin, closeResult: () => setShowResult(false),
    spinsLeft: canSpin ? 1 : 0 
  };
};