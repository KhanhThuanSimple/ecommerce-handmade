# 🎤 Slide Báo Cáo Đồ Án — E-Commerce Handmade Store
> **10 slides** | Thời gian trình bày gợi ý: ~15–20 phút

---

## SLIDE 1 — TRANG BÌA

**Tiêu đề chính:**
> # 🛍️ Website Thương Mại Điện Tử Đồ Handmade

**Thông tin:**
- Môn học: Công nghệ Web
- Tên nhóm / thành viên
- Ngày báo cáo

**Hình minh họa:** Logo + ảnh chụp màn hình trang chủ website

---

## SLIDE 2 — GIỚI THIỆU DỰ ÁN & CÔNG NGHỆ

**Tiêu đề:** Tổng quan hệ thống

**Nội dung trái — Mô tả:**
> Website bán đồ thủ công mỹ nghệ (handmade) với đầy đủ chức năng thương mại điện tử, hỗ trợ AI chatbot và thanh toán trực tuyến.

**Nội dung phải — Tech Stack (dạng icon/badge):**

| Tầng | Công nghệ |
|------|-----------|
| **Frontend** | React 18 · TypeScript · React Router v6 |
| **Backend** | Spring Boot 3.2.4 · Java 17 |
| **Database** | PostgreSQL |
| **Auth** | JWT · Spring Security |
| **Thanh toán** | VNPay |
| **AI Chat** | Groq API · Ollama (local) |

**Sơ đồ kiến trúc đơn giản:**
```
[React SPA] ←→ [REST API / Spring Boot] ←→ [PostgreSQL]
                        ↕
              [JWT Auth · Spring Security]
                        ↕
              [VNPay · Groq/Ollama AI]
```

**Nói:** "Hệ thống gồm 2 phần chính: Frontend React TypeScript và Backend Spring Boot, kết nối qua REST API, bảo mật bằng JWT."

---

## SLIDE 3 — CHỨC NĂNG NGƯỜI DÙNG (PHẦN 1)

**Tiêu đề:** Chức năng khách hàng — Mua sắm

**Layout 2 cột — mỗi cột 1 nhóm chức năng:**

**Cột trái — 🛒 Mua sắm:**
- Duyệt sản phẩm theo danh mục, lọc giá
- Xem chi tiết sản phẩm + tab đánh giá
- Thêm vào giỏ hàng / mua ngay
- Checkout với thông tin giao hàng
- Thanh toán **COD** hoặc **VNPay**

**Cột phải — 👤 Tài khoản:**
- Đăng ký / Đăng nhập / Quên mật khẩu
- Trang cá nhân: xem & chỉnh sửa thông tin
- Lịch sử đơn hàng + xem chi tiết đơn
- Đổi email / mật khẩu

**Hình minh họa:** Screenshot trang Product List + ProductDetail

**Nói:** "Người dùng có thể lọc sản phẩm, xem chi tiết với tab đánh giá, thêm vào giỏ và thanh toán qua VNPay hoặc COD."

---

## SLIDE 4 — CHỨC NĂNG NGƯỜI DÙNG (PHẦN 2)

**Tiêu đề:** Chức năng khách hàng — Tương tác & Tiện ích

**Layout 2x2 grid:**

**📝 Đánh giá sản phẩm:**
- Chỉ đánh giá được sản phẩm đã mua
- Đánh giá theo từng đơn hàng (mua 2 lần → 2 đánh giá độc lập)
- Tab "Chưa đánh giá" / "Đã đánh giá" trong Profile
- Thống kê điểm trung bình + biểu đồ phân phối rating

**🎫 Voucher & Wishlist:**
- Áp mã giảm giá khi checkout
- Xem danh sách voucher đang có
- Thêm / xóa sản phẩm yêu thích

**🎡 Vòng quay may mắn:**
- Quay ngẫu nhiên nhận phần thưởng
- Tích điểm theo lần quay
- Lịch sử quay

**🤖 AI Chatbox:**
- Chat AI hỏi đáp về sản phẩm
- Hỗ trợ anonymous (không cần đăng nhập)
- Dual engine: Groq (cloud) + Ollama (local)

**Hình minh họa:** Screenshot LuckyWheel + ChatWidget + MyReviews

---

## SLIDE 5 — ADMIN PANEL

**Tiêu đề:** Quản trị hệ thống (Admin Panel)

**Layout: bảng 2 cột**

| Module | Chức năng chính |
|--------|----------------|
| 📊 **Dashboard** | Tổng quan: doanh thu, đơn hàng, người dùng mới hôm nay |
| 📦 **Quản lý sản phẩm** | CRUD sản phẩm, cập nhật tồn kho, upload ảnh |
| 🛒 **Quản lý đơn hàng** | Xem, lọc, cập nhật trạng thái đơn hàng |
| 👥 **Quản lý người dùng** | Xem danh sách, phân quyền ROLE_USER / ROLE_ADMIN |
| 📈 **Analytics** | Biểu đồ doanh thu theo thời gian, xuất Excel |
| 🎡 **Quản lý trò chơi** | Cấu hình giải thưởng vòng quay |
| 🎁 **Khuyến mãi** | Tạo / chỉnh sửa voucher |
| 🤖 **Cấu hình AI** | Quản lý FAQ chatbot, cấu hình AI engine |

**Hình minh họa:** Screenshot Admin Dashboard + Orders admin

**Nói:** "Admin có panel riêng với Protected Route — chỉ truy cập được khi đăng nhập với ROLE_ADMIN."

---

## SLIDE 6 — KIẾN TRÚC BACKEND — MVC + JPA

**Tiêu đề:** Kiến trúc Backend — Spring Boot MVC

**Sơ đồ luồng request:**
```
HTTP Request
     ↓
JwtAuthenticationFilter  (kiểm tra JWT token)
     ↓
Spring Security          (kiểm tra quyền ROLE)
     ↓
@RestController          (nhận request, map DTO)
     ↓
@Service                 (business logic, @Transactional)
     ↓
@Repository (JPA)        (truy vấn PostgreSQL)
     ↓
HTTP Response (DTO)
```

**Số liệu:**
- **18 modules** (auth, orders, products, reviews, cart, voucher, chatbox, luckywheel...)
- **16 Controllers** · **16 Services** · **15 Repositories**
- **15+ Entities** · **30+ DTOs**

**Điểm nổi bật JPA:**
- Custom JPQL + Native SQL queries
- JPA Specification (filter động)
- Pagination `PageRequest.of(page, size)`
- `@Transactional` / `@Transactional(readOnly = true)`

**Nói:** "Mọi request đều đi qua JWT filter trước, sau đó Spring Security kiểm tra quyền, rồi mới đến Controller → Service → Repository."

---

## SLIDE 7 — BẢO MẬT & XÁC THỰC

**Tiêu đề:** Bảo mật — JWT + Spring Security

**Cột trái — JWT Flow:**
```
1. POST /api/auth/login
   { username, password }
        ↓
2. BCrypt.matches() xác thực
        ↓
3. JwtService tạo token
   (HMAC-SHA256, 24h)
        ↓
4. Client lưu localStorage
        ↓
5. Mọi request:
   Authorization: Bearer <token>
        ↓
6. JwtAuthenticationFilter
   → validate → set SecurityContext
```

**Cột phải — Phân quyền:**

```java
// Ví dụ từ MySecurity.java
.requestMatchers(HttpMethod.GET,
    "/api/reviews/products/**")
    .permitAll()          // Public

.requestMatchers(HttpMethod.GET,
    "/api/reviews/users/**")
    .hasAnyRole("USER","ADMIN")   // Cần đăng nhập

.requestMatchers("/api/admin/**")
    .hasRole("ADMIN")    // Chỉ Admin
```

**Icons/badges:**
- 🔐 BCryptPasswordEncoder — hash mật khẩu 1 chiều
- 🛡️ Stateless Session — không lưu session server
- 🌐 CORS Config — chỉ cho phép localhost:3000
- 🔑 RBAC — ROLE_USER / ROLE_ADMIN

---

## SLIDE 8 — TÍCH HỢP THANH TOÁN VNPAY

**Tiêu đề:** Tích hợp VNPay — Strategy Pattern

**Sơ đồ luồng thanh toán:**
```
User chọn VNPay
      ↓
Backend tạo URL thanh toán
+ HMAC-SHA512 checksum
      ↓
Redirect sang VNPay Sandbox
      ↓
User thanh toán thành công
      ↓
VNPay callback IPN
→ Backend xác thực checksum
→ Cập nhật trạng thái đơn
→ Trừ tồn kho
      ↓
Redirect về /payment-success
```

**Strategy Pattern:**
```
PaymentFactory
    → PaymentStrategy (interface)
        → VNPayPaymentStrategy ✅
        → [MoMo] (có thể mở rộng)
        → [ZaloPay] (có thể mở rộng)
```

**Kỹ thuật:**
- HMAC-SHA512 bảo vệ tính toàn vẹn của callback
- Open/Closed: thêm phương thức mới không sửa code cũ
- COD: trừ kho ngay khi tạo đơn
- VNPay: chỉ trừ kho sau khi callback xác thực thành công

---

## SLIDE 9 — AI CHATBOX & TÍNH NĂNG ĐẶC BIỆT

**Tiêu đề:** Tính năng nổi bật

**Bố cục 2 phần:**

**🤖 AI Chatbox (trái):**

```
User gửi tin nhắn
        ↓
ChatService kiểm tra FAQ
(nếu match → trả ngay)
        ↓
Nếu không match:
  → OllamaService (local AI)
    hoặc GroqService (cloud AI)
        ↓
Lưu lịch sử ChatMessage
        ↓
Trả kết quả cho User
```

- Hỗ trợ anonymous user (không cần đăng nhập)
- Dual engine: **Ollama** (offline) / **Groq** (cloud)
- `ChatCleanupScheduler` — tự dọn session cũ
- WebSocket ready

**⭐ Đánh giá sản phẩm (phải):**

Logic phức tạp:
- Phải mua sản phẩm → mới được đánh giá
- Xác thực đơn hàng thuộc về đúng user
- Đánh giá theo `order_item_id` — mua 2 lần = 2 lượt đánh giá
- Statistics: avg rating + distribution bars (1★→5★)
- Phân trang độc lập cho "Chưa đánh giá" và "Đã đánh giá"

**Thêm:**
- 📊 Excel Export báo cáo (Apache POI)
- ⚡ Spring Cache (`@Cacheable` + `@CacheEvict`)
- 🔄 JPA Specification cho filter động

---

## SLIDE 10 — KẾT LUẬN & DEMO

**Tiêu đề:** Kết quả đạt được & Hướng phát triển

**Bố cục 3 phần:**

**✅ Đã hoàn thành:**

| Nhóm | Số lượng |
|------|---------|
| Trang giao diện khách hàng | 21 trang |
| Trang Admin Panel | 8 trang |
| REST API endpoints | 50+ |
| Backend modules | 18 modules |
| Kỹ thuật nâng cao | Cache, JWT, JPA, VNPay, AI, WebSocket, Excel |

**🔧 Kỹ thuật nổi bật:**
- ✅ React TypeScript + Custom Design System
- ✅ Spring Boot MVC 3 lớp rõ ràng
- ✅ JWT + BCrypt + RBAC
- ✅ JPA: JPQL, Native SQL, Specification, Pagination
- ✅ VNPay HMAC-SHA512 + Strategy Pattern
- ✅ AI Dual Engine + Spring Cache

**🚀 Hướng phát triển:**
- Thêm phương thức thanh toán (MoMo, ZaloPay)
- Hệ thống thông báo real-time (WebSocket)
- Tích hợp CDN lưu ảnh sản phẩm (Cloudinary)
- Deploy lên cloud (AWS / Render)
- Unit test & Integration test

---

**[Cuối slide]**
> ### 🙏 Cảm ơn thầy/cô và các bạn đã lắng nghe!
> ### Demo trực tiếp →

---

## 📋 GỢI Ý TRÌNH BÀY

| Slide | Thời gian | Ghi chú |
|-------|-----------|---------|
| 1 — Trang bìa | 30 giây | Giới thiệu nhóm nhanh |
| 2 — Tổng quan | 1.5 phút | Nhấn mạnh tech stack |
| 3 — Chức năng mua sắm | 2 phút | Demo live nếu có thể |
| 4 — Tương tác & tiện ích | 2 phút | Demo review + chat |
| 5 — Admin Panel | 1.5 phút | Screenshot dashboard |
| 6 — Kiến trúc Backend | 2 phút | Giải thích sơ đồ luồng |
| 7 — Bảo mật | 2 phút | Giải thích JWT flow |
| 8 — VNPay | 1.5 phút | Strategy pattern |
| 9 — AI + Đánh giá | 2 phút | Logic phức tạp |
| 10 — Kết luận | 1 phút | Kết lại, mời demo |
| **Tổng** | **~16 phút** | + 4 phút buffer |

## 💡 LƯU Ý KHI TRÌNH BÀY

1. **Slide 6 (Backend MVC):** Chuẩn bị sẵn code ReviewService để show khi giải thích `@Transactional`
2. **Slide 7 (Bảo mật):** Show `MySecurity.java` — giải thích thứ tự rule
3. **Slide 8 (VNPay):** Có thể demo sandbox nếu môi trường cho phép
4. **Slide 9 (AI):** Demo chat widget — nhấn mạnh hỗ trợ offline với Ollama
5. **Demo:** Ưu tiên flow: Đăng nhập → Xem sản phẩm → Thêm giỏ → Checkout → Admin xem đơn → Đánh giá
