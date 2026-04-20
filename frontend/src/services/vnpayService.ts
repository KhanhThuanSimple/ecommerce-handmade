import CryptoJS from 'crypto-js';

export const generateVNPayUrl = (amount: number, orderId: string) => {
    const tmnCode = '3YVU8UO5';
    const secretKey = 'DPY40HQ9Q8BA7GUMGZKCKYY7I9V3STA8';
    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    const returnUrl = `${window.location.origin}/vnpay-return`;

    const date = new Date();
    const createDate = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0') +
        date.getHours().toString().padStart(2, '0') +
        date.getMinutes().toString().padStart(2, '0') +
        date.getSeconds().toString().padStart(2, '0');

    const vnp_Params: any = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': `Thanh toan don hang ${orderId}`,
        'vnp_OrderType': 'other',
        'vnp_Amount': amount * 100,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': '127.0.0.1',
        'vnp_CreateDate': createDate,
    };

    const sortedKeys = Object.keys(vnp_Params).sort();
    const signData = sortedKeys
        .map(key => `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`)
        .join('&');

    const hmac = CryptoJS.HmacSHA512(signData, secretKey);
    const signed = hmac.toString(CryptoJS.enc.Hex);

    return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
};