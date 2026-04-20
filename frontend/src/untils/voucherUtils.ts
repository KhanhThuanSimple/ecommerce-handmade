 export const filterVouchersForUser = (
  allVouchers: any[], 
  userOrders: any[], 
  currentTotal: number
) => {
  const now = new Date();
  
  // 1. Lấy thứ trong tuần để check voucher cuối tuần (Weekend)
  // Lưu ý: getDay() trả về 0 cho Chủ Nhật, 6 cho Thứ Bảy
  const dayIndex = now.getDay();
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  // 2. Tính số lượng đơn hàng THÀNH CÔNG của User (không tính đơn Đã hủy)
  const completedOrdersCount = userOrders.filter(
    order => order.status !== "Đã hủy"
  ).length;

  return allVouchers.filter((v) => {
    // --- KIỂM TRA ĐIỀU KIỆN CỨNG ---
    if (v.status !== 'ACTIVE') return false;
    if (v.used >= v.quantity) return false;
    
    // Kiểm tra thời hạn (StartDate & ExpiredAt)
    const start = new Date(v.startDate);
    const end = new Date(v.expiredAt);
    if (now < start || now > end) return false;

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (currentTotal < v.minOrder) return false;

    // --- KIỂM TRA ĐIỀU KIỆN ĐẶC BIỆT ---
    
    // Kiểm tra ngày cuối tuần (Cho voucher VC005)
    if (v.validDays && v.validDays.includes("SATURDAY") && !isWeekend) {
        return false;
    }

    // --- KIỂM TRA ĐỐI TƯỢNG (TARGET) ---
    switch (v.target) {
      case 'NEW_USER':
        // Chỉ hiện nếu chưa từng mua hàng thành công
        return completedOrdersCount === 0;

      case 'LOYAL_USER':
        // Ví dụ: Đã mua từ 5 đơn (dựa trên minOrderCount trong JSON của bạn)
        return completedOrdersCount >= (v.minOrderCount || 5);

      case 'VIP_USER':
        // Ví dụ: Đã mua từ 20 đơn
        return completedOrdersCount >= (v.minOrderCount || 20);

      case 'ALL':
      default:
        return true;
    }
  });
};
