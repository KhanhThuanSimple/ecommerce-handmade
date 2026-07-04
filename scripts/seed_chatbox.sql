-- ============================================================
--  SEED DỮ LIỆU CHATBOX
--  Chạy sau khi Spring Boot đã tạo schema
--  psql -U postgres -d ecommerce_handmade_dev -f scripts/seed_chatbox.sql
-- ============================================================

-- ────────────────────────────────────────────
-- 1. AI CONFIGURATIONS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_configurations (
    id         BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO ai_configurations (config_key, config_value, description) VALUES
('GROQ_API_KEY',    '',                          'API key Groq — để trống để dùng FAQ offline'),
('AI_MODEL',        'llama-3.1-8b-instant',      'Model Groq hoặc Ollama'),
('TEMPERATURE',     '0.7',                       'Độ sáng tạo 0.0-1.0'),
('GROQ_API_URL',    'https://api.groq.com/openai/v1/chat/completions', 'Endpoint Groq API'),
('SHOP_ADDRESS',    'TP. Hồ Chí Minh, Việt Nam', 'Địa chỉ cửa hàng'),
('SHOP_POLICY',     'Đổi trả 7 ngày, giao hàng toàn quốc 2-5 ngày, miễn ship đơn từ 300.000đ', 'Chính sách'),
('FEATURED_PRODUCTS_CONTEXT', 'Túi Tote Canvas 89k, Ví Da Nam Bifold 450k, Vòng tay mã não 199k', 'Sản phẩm nổi bật'),
('SYSTEM_PROMPT',   'Bạn là trợ lý ảo của HandMade Shop, chuyên bán đồ thủ công mỹ nghệ Việt Nam. Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn 2-4 câu. Dùng emoji phù hợp. Không bịa thông tin về giá hoặc tồn kho cụ thể.', 'System prompt')
ON CONFLICT (config_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 2. CHAT FAQ
-- ────────────────────────────────────────────
TRUNCATE TABLE chat_faqs RESTART IDENTITY;

INSERT INTO chat_faqs (keywords, response_text, is_active) VALUES
-- Chào hỏi
('xin chào,chào,hello,hi,hey,alo,bắt đầu',
 'Chào bạn! 👋 Mình là trợ lý ảo của HandMade Shop. Mình có thể giúp bạn tìm sản phẩm, hỏi giá, giao hàng hoặc đặt làm riêng. Bạn cần hỗ trợ gì ạ?',
 TRUE),

-- Sản phẩm theo danh mục
('túi,ví,túi xách,túi đeo,ví da,clutch,balo,tote',
 'Shop có bộ sưu tập túi và ví handmade phong phú từ Túi Tote Canvas 89k đến Ví Da Nam Bifold 450k 🛍️ Ghé mục Sản phẩm → Túi & Ví để xem đầy đủ nhé!',
 TRUE),

('vòng tay,nhẫn,vòng cổ,khuyên tai,trang sức,jewelry,đá thiên nhiên,mã não,ngọc bích',
 'Shop có nhiều trang sức handmade từ đá thiên nhiên rất đẹp 💎 Từ vòng tay mã não 199k đến set trang sức ngọc bích. Xem thêm tại mục Trang sức!',
 TRUE),

('trang trí,decor,nhà cửa,đèn,tranh,đồ decor,nến,bình hoa',
 'Shop có nhiều sản phẩm decor handmade làm ấm cúng không gian sống ✨ Ghé mục Trang trí nhà cửa để xem các mẫu đang hot!',
 TRUE),

('phụ kiện,móc khóa,kẹp tóc,khăn,nón,cài tóc,băng đô',
 'Shop có nhiều phụ kiện handmade xinh xắn và độc đáo 🎀 Xem thêm tại mục Phụ kiện nhé!',
 TRUE),

('gốm sứ,bình gốm,ly gốm,chén,đĩa,ceramic,gốm thủ công',
 'Mỗi sản phẩm gốm sứ của shop là một tác phẩm độc nhất vô nhị 🏺 Ghé mục Gốm sứ để xem các thiết kế đặc sắc!',
 TRUE),

('đồ da,ví da,túi da,thắt lưng,dây nịt,leather',
 'Shop dùng da bò nhập khẩu chất lượng cao 🤎 Xem thêm tại mục Đồ da, giá từ 199k-800k!',
 TRUE),

('mỹ phẩm,son,kem dưỡng,skincare,làm đẹp,serum,xà phòng handmade',
 'Shop có mỹ phẩm handmade thiên nhiên, lành tính cho da 🌿 Xem thêm tại mục Mỹ phẩm!',
 TRUE),

('văn phòng,sticker,sổ,bút,giấy,stationery,planner',
 'Các mẫu văn phòng phẩm handmade dễ thương đang có sẵn 📓 Ghé mục Văn phòng phẩm nhé!',
 TRUE),

-- Giá cả
('giá,bao nhiêu tiền,giá bao nhiêu,mắc không,rẻ không,giá cả,chi phí',
 'Sản phẩm handmade của shop dao động từ 89.000đ - 1.500.000đ tùy chất liệu và độ thủ công 💰 Bạn click vào từng sản phẩm để xem giá chi tiết nhé!',
 TRUE),

-- Đặt riêng
('đặt làm riêng,custom,đặt theo yêu cầu,khắc tên,thiết kế riêng,personalized,in tên',
 'Shop nhận đặt làm riêng và khắc tên theo yêu cầu 💝 Thời gian 3-7 ngày tùy độ phức tạp. Nhắn tin chi tiết yêu cầu, shop báo giá trong 24h!',
 TRUE),

-- Quà tặng
('quà tặng,tặng sinh nhật,tặng người yêu,tặng bạn,gift,tặng,kỷ niệm,valentine,8/3',
 'Đồ handmade là món quà ý nghĩa và độc đáo nhất 🎁 Shop hỗ trợ gói quà miễn phí và viết thiệp theo yêu cầu. Đặt trước 2-3 ngày nhé!',
 TRUE),

-- Giao hàng
('giao hàng,ship,vận chuyển,bao lâu nhận,phí ship,shipper,nhận hàng',
 'Shop giao hàng toàn quốc qua J&T, GHTK 🚚 Thời gian 2-5 ngày tùy khu vực. Đơn từ 300.000đ được MIỄN PHÍ ship nội thành!',
 TRUE),

-- Đổi trả
('đổi trả,hoàn tiền,bảo hành,lỗi,hỏng,không vừa,sai màu,khác hình',
 'Shop hỗ trợ đổi trả trong 7 ngày nếu sản phẩm lỗi do nhà sản xuất 🔄 Chụp ảnh lỗi và nhắn tin cho shop, mình xử lý trong 24h!',
 TRUE),

-- Thanh toán
('thanh toán,chuyển khoản,cod,vnpay,trả tiền,hình thức thanh toán,momo',
 'Shop hỗ trợ thanh toán COD (trả khi nhận hàng) và VNPay 💳 Bạn chọn phương thức phù hợp ở bước thanh toán nhé!',
 TRUE),

-- Khuyến mãi
('khuyến mãi,giảm giá,sale,ưu đãi,voucher,mã giảm,mã khuyến mãi,coupon',
 'Shop thường xuyên có ưu đãi vào dịp lễ 🎉 Bạn có thể quay vòng quay may mắn tại trang Games để nhận voucher MIỄN PHÍ ngay!',
 TRUE),

-- Chất liệu
('chất liệu,làm bằng gì,nguyên liệu,an toàn,thân thiện môi trường,độc hại không',
 'Shop dùng nguyên liệu thân thiện môi trường, không độc hại 🌿 Da bò tự nhiên, vải cotton hữu cơ, đá thiên nhiên. Chi tiết trong từng sản phẩm ạ!',
 TRUE),

-- Liên hệ
('liên hệ,hotline,số điện thoại,email,zalo,facebook,địa chỉ cửa hàng',
 'Bạn có thể liên hệ shop qua:\n📞 Hotline: 0909-xxx-xxx\n💬 Zalo/Facebook: HandMade Shop\n📧 Email: handmade@shop.com\nShop phản hồi trong 1-2 giờ!',
 TRUE),

-- Tài khoản
('đăng ký,tài khoản,đăng nhập,quên mật khẩu,tạo tài khoản',
 'Bạn có thể tạo tài khoản tại trang Đăng ký để lưu địa chỉ, xem lịch sử đơn và nhận ưu đãi thành viên 👤',
 TRUE),

-- Đơn hàng
('đơn hàng,theo dõi đơn,kiểm tra đơn,tình trạng đơn,đơn của tôi',
 'Bạn vào mục Đơn hàng sau khi đăng nhập để xem tình trạng đơn nhé 📦 Nếu cần hỗ trợ gấp, nhắn hotline 0909-xxx-xxx!',
 TRUE),

-- Cảm ơn / kết thúc
('cảm ơn,thanks,thank you,ok,được rồi,hiểu rồi,oke,tuyệt',
 'Cảm ơn bạn đã ghé HandMade Shop! 💝 Nếu cần thêm hỗ trợ, nhắn tin bất cứ lúc nào nhé. Chúc bạn mua sắm vui vẻ!',
 TRUE);

-- ────────────────────────────────────────────
-- THỐNG KÊ
-- ────────────────────────────────────────────
SELECT 'ai_configurations' AS table_name, COUNT(*) AS rows FROM ai_configurations
UNION ALL
SELECT 'chat_faqs', COUNT(*) FROM chat_faqs;
