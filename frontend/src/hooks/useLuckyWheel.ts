import { useState, useCallback, useMemo, useEffect } from 'react';
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
    if (spinning || prizes.length === 0 || !currentUser) return;

    setSpinning(true);
    setResult(null);
    setHighlightedPrize(null);

    try {
      const response = await api.post(`/prizes/spin/${currentUser.id}`);
      const wonPrize = response.data;
      
      const prizeIndex = prizes.findIndex(p => p.id === wonPrize.id);
      if (prizeIndex === -1) {
        throw new Error("Không tìm thấy giải thưởng trên giao diện");
      }
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
          setTimeout(() => {
            setResult(selectedPrize);
            setShowResult(true);
            setHighlightedPrize(prizeIndex);
            setSpinning(false);
            setCanSpin(false);
            
            if (selectedPrize.type === 'points') {
              notify.success(`Chúc mừng bạn nhận được ${selectedPrize.value} Điểm!`);
            } else {
              notify.success(`Chúc mừng! Bạn đã trúng ${selectedPrize.name}. Voucher đã được chuyển vào ví.`);
            }
          }, 300);
        }
      };
      requestAnimationFrame(animate);
      
    } catch (error: any) {
      setSpinning(false);
      if (error.response && error.response.data) {
        const msg = error.response.data;
        if (msg === "HẾT_LƯỢT" || msg.includes("HẾT_LƯỢT")) {
          notify.error("Bạn đã hết lượt quay hôm nay. Vui lòng quay lại vào ngày mai!");
        } else {
          notify.error(msg);
        }
      } else {
        notify.error("Có lỗi xảy ra khi quay thưởng.");
      }
    }
  }, [spinning, currentUser, prizes, angle, slice, notify]);

  return {
    prizes, angle, spinning, result, showResult, 
    highlightedPrize, loading, canSpin, slice, 
    spin, closeResult: () => setShowResult(false),
    spinsLeft: canSpin ? 1 : 0 
  };
};