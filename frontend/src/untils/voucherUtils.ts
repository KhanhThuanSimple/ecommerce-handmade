export const filterVouchersForUser = (
    allVouchers: any[],
    userOrders: any[],
    currentTotal: number,
    // userId giữ lại để callers (useProfile, Checkout) gọi đúng 4 args
    // hiện tại chưa dùng trong logic nhưng signature phải khớp
    _userId?: number | string
) => {
    const now = new Date();

    // Thứ trong tuần: 0 = Chủ Nhật, 6 = Thứ Bảy
    const dayIndex  = now.getDay();
    const isWeekend = dayIndex === 0 || dayIndex === 6;

    // Số đơn hàng thành công (không tính đơn đã hủy)
    const completedOrdersCount = userOrders.filter(
        o => o.status !== 'Đã hủy'
    ).length;

    return allVouchers.filter((v) => {
        // ── Điều kiện cứng ──────────────────────────────────
        if (v.status !== 'ACTIVE')          return false;
        if (v.used >= v.quantity)           return false;

        // Kiểm tra thời hạn
        if (v.startDate && now < new Date(v.startDate)) return false;
        if (v.expiredAt && now > new Date(v.expiredAt)) return false;

        // Kiểm tra đơn tối thiểu
        if (currentTotal < (v.minOrder ?? 0)) return false;

        // ── Voucher cuối tuần ────────────────────────────────
        if (v.validDays?.includes('SATURDAY') && !isWeekend) return false;

        // ── Đối tượng áp dụng ───────────────────────────────
        switch (v.target) {
            case 'NEW_USER':
                return completedOrdersCount === 0;
            case 'LOYAL_USER':
                return completedOrdersCount >= (v.minOrderCount ?? 5);
            case 'VIP_USER':
                return completedOrdersCount >= (v.minOrderCount ?? 20);
            case 'ALL':
            default:
                return true;
        }
    });
};
