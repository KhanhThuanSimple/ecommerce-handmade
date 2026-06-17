# Sequence Diagrams — Ecommerce Handmade

Tài liệu mô tả luồng xử lý chi tiết của từng chức năng chính, từ Frontend → Backend → Database.

---

## 1. Luồng Đăng nhập & Phân quyền

```
User          Login.tsx      useLogin.ts    AuthService.ts    API (BE)      DB
 │                │               │               │               │          │
 │──fill form────▶│               │               │               │          │
 │──submit────────▶               │               │               │          │
 │                │──handleSubmit─▶               │               │          │
 │                │               │──loginUser()──▶               │          │
 │                │               │               │─POST /auth/login─────────▶
 │                │               │               │               │──SELECT──▶
 │                │               │               │               │◀──User+roles─
 │                │               │               │◀──{token,roles,id}────────
 │                │               │◀──user object─┤               │          │
 │                │               │               │               │          │
 │                │               │ [lưu localStorage:            │          │
 │                │               │  'user', 'authHeader']        │          │
 │                │               │               │               │          │
 │                │               │──mergeCart()──▶(CartContext)  │          │
 │                │               │──onLoginSuccess(user)         │          │
 │                │               │               │               │          │
 │                │    [roles.includes('ROLE_ADMIN')?]            │          │
 │                │               │──navigate('/admin')  (Admin)  │          │
 │                │               │──navigate('/')       (User)   │          │
```

**Lỗ hổng đã phát hiện & vá:**
- ✅ `useLogin` trước đây navigate `/admin/Dashboard` (sai route) → đã sửa thành `/admin`
- ✅ `handleLoginSuccess` trong App.tsx không còn override navigate của useLogin
- ✅ Trang `/login` khi đã đăng nhập: redirect đúng theo role (admin→`/admin`, user→`/`)

---

## 2. Luồng Admin Protected Route

```
Browser        App.tsx          ProtectedRoute      AdminLayout        Sidebar
   │               │                  │                  │                │
   │──GET /admin───▶                  │                  │                │
   │               │──render──────────▶                  │                │
   │               │         [currentUser null?]         │                │
   │               │         YES → Navigate('/login')    │                │
   │               │         [isAdmin?]                  │                │
   │               │         NO  → Navigate('/')         │                │
   │               │         YES──────────────────────────▶               │
   │               │                  │      [đọc localStorage['user']]   │
   │               │                  │      [render Sidebar với user thật]▶
   │               │                  │                  │──render nav────▶
   │               │                  │                  │                │
   │◀──────────────────────────────────── Admin Dashboard ─────────────────
```

**Lỗ hổng đã vá:**
- ✅ `AdminLayout` trước hardcode user → đọc từ `localStorage['user']`
- ✅ `handleLogout` trong AdminLayout xóa đúng key `user` + `authHeader` + `userEmail`

---

## 3. Luồng Admin → Quay lại trang người dùng

```
Admin          Sidebar           AdminLayout        App Router
  │               │                  │                 │
  │──click "Về trang người dùng"──────▶                │
  │               │──onBackToSite()──▶                 │
  │               │                  │──navigate('/')──▶
  │               │                  │                 │
  │◀─────────────────────────────────── Trang chủ người dùng
  │  [user vẫn đăng nhập, Header hiển thị tên admin]
```

**Lưu ý:** Admin vẫn giữ session, Header nhận `currentUser` từ App state nên hiển thị đúng tên.

---

## 4. Luồng Đăng xuất

```
Admin/User     Sidebar/Header     App.tsx           localStorage
    │               │                │                   │
    │──click Đăng xuất───────────────▶                   │
    │               │    handleLogout()                  │
    │               │                │──remove('user')───▶
    │               │                │──remove('authHeader')──▶
    │               │                │──remove('userEmail')───▶
    │               │                │──setCurrentUser(null)  │
    │               │                │──navigate('/login')    │
    │◀───────────────────────────────── Trang đăng nhập       │
```

---

## 5. Luồng Thêm vào giỏ hàng

```
User      ProductDetail    CartContext       api.ts (axios)    BE /carts    DB
  │            │               │                 │                │          │
  │──click────▶│               │                 │                │          │
  │            │──addToCart()──▶                 │                │          │
  │            │    [check stock > 0?]           │                │          │
  │            │    [currentUser logged in?]     │                │          │
  │            │                │               │                │          │
  │            │    NO (guest)──│ lưu guestCart localStorage     │          │
  │            │                │               │                │          │
  │            │    YES─────────│──POST /carts/add────────────────▶          │
  │            │                │               │                │──INSERT───▶
  │            │                │               │                │◀─success──
  │            │                │◀──response────┤                │          │
  │            │                │──refreshCart()──GET /carts/:id─▶          │
  │            │                │               │                │──SELECT───▶
  │            │◀──cartCount────┤               │                │◀──items───
  │◀──badge updated──────────────               │                │          │
  │            │──notify.success()              │                │          │
```

---

## 6. Luồng Merge Cart (sau đăng nhập)

```
useLogin      CartContext          api.ts         BE /carts/merge    DB
    │              │                  │                 │              │
    │──mergeCart(userId)──────────────▶                │              │
    │              │   [lấy guestCart từ localStorage] │              │
    │              │   [guestCart rỗng? → return]      │              │
    │              │──POST /carts/merge────────────────▶              │
    │              │   {userId, items:[...]}            │──UPSERT──────▶
    │              │                  │                 │◀─success─────
    │              │──remove('guestCart') localStorage  │              │
    │              │──refreshCart()───▶GET /carts/:id──▶              │
    │◀─────────────┤ cartCount updated                 │              │
```

---

## 7. Luồng Tạo đơn hàng & Thanh toán VNPay

```
User        Checkout.tsx      OrderService    BE /orders    BE /payment/vnpay    VNPay
  │              │                │               │                │               │
  │──fill form──▶│                │               │                │               │
  │──submit──────│──POST /orders──▶               │                │               │
  │              │                │──createOrder()▶               │               │
  │              │                │               │──INSERT order──────────────────│
  │              │                │               │──trừ tồn kho───────────────────│
  │              │                │◀──orderId─────┤                │               │
  │              │                │               │                │               │
  │──chọn VNPay──│──POST /payment/vnpay/create────▶                │               │
  │              │                │               │──tạo URL + HMAC-SHA512──────────▶
  │              │                │               │◀──paymentUrl───────────────────
  │◀─redirect────┤                │               │                │               │
  │──────────────────────────────────────────── VNPay payment page ▶               │
  │──thanh toán──────────────────────────────────────────────────────callback──────▶
  │              │                │               │◀──/vnpay/return (GET)──────────
  │              │                │               │──verify HMAC signature          │
  │              │                │               │──UPDATE order status            │
  │◀─/payment-success─────────────┤               │                │               │
```

---

## 8. Luồng AI Chatbox

```
User         ChatWidget       chatService       BE /chat       AiChatService    Groq API
  │              │                │                 │                │               │
  │──type msg───▶│                │                 │                │               │
  │──send────────│──POST /chat/message──────────────▶               │               │
  │              │                │     [tạo/lấy sessionId]         │               │
  │              │                │     [lưu user message vào DB]   │               │
  │              │                │     [lấy context 10 tin nhắn]   │               │
  │              │                │                 │──callGroq()───▶               │
  │              │                │                 │               │──POST /completions──▶
  │              │                │                 │               │◀──AI response───────
  │              │                │                 │◀──aiReply─────┤               │
  │              │                │                 │──lưu AI msg vào DB            │
  │              │◀──response─────┤◀────────────────┤               │               │
  │◀──hiển thị──┤                │                 │                │               │
  │              │                │                 │                │               │
  │       [Groq API lỗi?]         │                 │                │               │
  │              │                │                 │──FAQ fallback──▶ (tìm trong DB)│
  │◀──FAQ answer─┤                │                 │                │               │
```

---

## 9. Luồng Vòng quay may mắn

```
User         LuckyWheel.tsx    gameService      BE /luckywheel    DB
  │              │                 │                  │             │
  │──click quay─▶│                 │                  │             │
  │              │──POST /luckywheel/spin──────────────▶            │
  │              │                 │     [check UserSpinProfile]    │
  │              │                 │     [còn lượt quay?]           │
  │              │                 │     NO → error response        │
  │              │                 │     YES──random weighted prize─▶
  │              │                 │                  │──SELECT prizes──▶
  │              │                 │                  │◀──prize list──
  │              │                 │                  │──UPDATE UserSpinProfile
  │              │                 │                  │──ghi nhận phần thưởng
  │              │◀──prizeResult───┤◀─────────────────┤             │
  │◀──animation──┤                 │                  │             │
  │◀──kết quả────┤                 │                  │             │
```

---

## 10. Luồng Quản lý đơn hàng Admin

```
Admin       Orders.tsx     adminOrderService    BE /admin/orders    DB
  │             │                 │                    │              │
  │──load page─▶│                 │                    │              │
  │             │──GET /admin/orders?filter─────────────▶             │
  │             │                 │     [AdminOrderSpecification]     │
  │             │                 │                    │──SELECT with JOIN──▶
  │             │                 │                    │◀──order list──────
  │◀──table────┤◀─────────────────┤◀───────────────────┤              │
  │             │                 │                    │              │
  │──update status─────────────────────────────────────▶              │
  │             │                 │     [PUT /admin/orders/:id]       │
  │             │                 │                    │──UPDATE──────▶
  │             │                 │                    │──INSERT OrderHistory─▶
  │◀──updated──┤                 │                    │              │
  │             │                 │                    │              │
  │──export Excel───────────────────────────────────────▶             │
  │             │                 │    [Apache POI tạo .xlsx]         │
  │◀──download─┤                 │                    │              │
```

---

## 11. Luồng Xác thực JWT (mọi request)

```
Frontend (api.ts)          BE (JwtAuthFilter)       BE Controller      DB
      │                           │                      │               │
      │──Request + Authorization: Bearer <token>─────────▶               │
      │                           │ [JwtService.validateToken()]         │
      │                           │ [load UserDetailsService]            │
      │                           │                      │──SELECT User──▶
      │                           │                      │◀──User────────
      │                           │ [set SecurityContext]│               │
      │                           │──pass to controller──▶               │
      │                           │                      │──process──────│
      │◀─────────────────────────────────────────────────┤               │
      │                           │                      │               │
      │──Request không có token───▶                      │               │
      │                           │ [return 401]         │               │
      │◀──401 Unauthorized────────┤                      │               │
      │  [api.ts: remove 'user' localStorage]            │               │
```

---

## 12. Lỗ hổng bảo mật đã phát hiện & trạng thái

| # | Vấn đề | Mức độ | Trạng thái |
|---|---|---|---|
| 1 | `AdminLayout` dùng user hardcode, không xác thực thật | Cao | ✅ Đã vá |
| 2 | `handleLogout` xóa sai localStorage key (`adminUser` thay vì `user`) | Cao | ✅ Đã vá |
| 3 | `useLogin` navigate sai route `/admin/Dashboard` | Trung bình | ✅ Đã vá |
| 4 | Login page redirect không xét role admin | Thấp | ✅ Đã vá |
| 5 | `handleLoginSuccess` override navigate của useLogin | Trung bình | ✅ Đã vá |
| 6 | `forgotPassword` là stub giả, không gọi API thật | Trung bình | ⚠️ Cần BE endpoint |
| 7 | Token `authHeader` không bị xóa khi logout từ trang user | Thấp | ✅ Đã vá |
| 8 | Không có refresh token — JWT hết hạn sẽ cần đăng nhập lại | Trung bình | ⚠️ Cần cải thiện |
| 9 | VNPay credentials (tmn-code, hash-secret) lộ trong `application.properties` | Cao | ⚠️ Dùng env variable |
| 10 | DB credentials lộ trong `application.properties` | Cao | ⚠️ Dùng env variable |
| 11 | `apiInterceptor.ts` dùng global `axios` interceptor, xung đột với `api.ts` instance | Thấp | ⚠️ Cần kiểm tra |
| 12 | `CartContext` không có error boundary, lỗi API có thể crash context | Thấp | ⚠️ Cần cải thiện |
