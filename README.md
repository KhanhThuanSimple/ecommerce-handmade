# 🛍️ Ecommerce Handmade — Nền tảng thương mại điện tử hàng thủ công

Dự án web thương mại điện tử chuyên bán sản phẩm thủ công mỹ nghệ, tích hợp AI chatbot, thanh toán VNPay, vòng quay may mắn và bảng quản trị toàn diện.

---

## 📋 Mục lục

- [Tổng quan kiến trúc](#-tổng-quan-kiến-trúc)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Tính năng chính](#-tính-năng-chính)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Biến môi trường](#-biến-môi-trường)
- [API Endpoints](#-api-endpoints)
- [Module Backend](#-module-backend-chi-tiết)
- [Frontend Pages](#-frontend-pages-chi-tiết)

---

## 🏗️ Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (React 19)                   │
│              localhost:3000  /  Vercel                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST + WebSocket (STOMP)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Spring Boot 3.2.4)                │
│                    localhost:8080                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  REST APIs  │  │  WebSocket   │  │  Spring       │  │
│  │ (17 modules)│  │  (Chat)      │  │  Security+JWT │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└───────────┬──────────────┬──────────────────────────────┘
            │              │
            ▼              ▼
┌───────────────┐   ┌──────────────────┐
│  PostgreSQL   │   │  External APIs   │
│  (Supabase)   │   │  VNPay / Groq AI │
└───────────────┘   └──────────────────┘
```

---

## 🛠️ Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Java | 17 | Ngôn ngữ lập trình |
| Spring Boot | 3.2.4 | Framework chính |
| Spring Security | 6.x | Xác thực & phân quyền |
| Spring Data JPA | 3.x | ORM, tương tác database |
| Spring WebSocket | 3.x | Real-time chat (STOMP) |
| JWT (jjwt) | 0.11.5 | Token xác thực |
| PostgreSQL | — | Cơ sở dữ liệu (host: Supabase) |
| HikariCP | — | Connection pooling |
| Apache POI | 5.2.5 | Xuất file Excel |
| Lombok | 1.18.44 | Giảm boilerplate code |
| VNPay SDK | — | Cổng thanh toán |
| Groq AI API | llama-3.1-8b-instant | Chatbot AI |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 4.9.5 | Type safety |
| React Router DOM | 7 | Client-side routing |
| TailwindCSS | 3 | Utility-first CSS |
| Axios | 1.x | HTTP client |
| TanStack React Query | 5 | Data fetching & caching |
| Chart.js + react-chartjs-2 | 4.x | Biểu đồ thống kê |
| @stomp/stompjs + sockjs-client | — | WebSocket client |
| Groq SDK | 0.37 | AI chat (client-side) |
| lucide-react + react-icons | — | Icon library |
| crypto-js | 4.x | Mã hóa dữ liệu |

---

## ✨ Tính năng chính

### 👤 Người dùng
- **Đăng ký / Đăng nhập** bằng email + mật khẩu, xác thực JWT
- **Quên mật khẩu** với luồng khôi phục tài khoản
- **Hồ sơ cá nhân** — xem và cập nhật thông tin
- **Danh sách yêu thích** — lưu sản phẩm quan tâm

### 🛍️ Mua sắm
- **Duyệt sản phẩm** theo danh mục (đồ da, gốm sứ, mỹ phẩm, phụ kiện, trang sức, trang trí, túi ví, văn phòng phẩm)
- **Chi tiết sản phẩm** — ảnh phóng to, biến thể (màu sắc, kích thước), đánh giá
- **Giỏ hàng** — thêm, cập nhật số lượng, merge cart khi đăng nhập
- **Checkout** — điền địa chỉ, áp dụng voucher giảm giá
- **Thanh toán VNPay** — cổng thanh toán trực tuyến (sandbox)
- **Lịch sử đơn hàng** — theo dõi trạng thái từng đơn
- **Đánh giá sản phẩm** — viết review sau khi mua

### 🎮 Gamification
- **Vòng quay may mắn** — người dùng đăng nhập có thể quay nhận phần thưởng (voucher, điểm thưởng, quà...)

### 💬 Chatbot AI
- **Chat widget** trên giao diện người dùng
- **Hỗ trợ AI** dùng Groq (Llama 3.1) để trả lời tự động
- **FAQ fallback** — khi AI lỗi, tự động trả về câu hỏi thường gặp được cấu hình sẵn
- **Session ẩn danh** — người dùng chưa đăng nhập vẫn chat được
- **Lịch sử hội thoại** theo ngữ cảnh (tối đa 10 tin nhắn)
- **Real-time** qua WebSocket (STOMP over SockJS)

### 🔧 Quản trị (Admin)
- **Dashboard** — tổng quan số liệu nhanh
- **Analytics** — biểu đồ doanh thu, đơn hàng theo thời gian
- **Quản lý sản phẩm** — thêm/sửa/xóa sản phẩm, biến thể, hình ảnh
- **Quản lý đơn hàng** — lọc, tìm kiếm, cập nhật trạng thái, xuất Excel
- **Quản lý người dùng** — xem danh sách, phân quyền, khóa tài khoản
- **Quản lý thanh toán** — xem giao dịch VNPay
- **Quản lý voucher** — tạo/sửa mã giảm giá
- **Quản lý trò chơi** — cấu hình giải thưởng vòng quay may mắn
- **Cấu hình Chatbot AI** — thay đổi prompt hệ thống, FAQ, model AI
- **Xuất báo cáo** — export dữ liệu ra file Excel (.xlsx) dùng Apache POI

---

## 📁 Cấu trúc dự án

```
ecommerce-handmade/
├── backend/                          # Spring Boot API
│   ├── pom.xml
│   └── src/main/java/com/handmade/handmade_api/
│       ├── config/                   # AppProperties, DataSeeder, WebSocketConfig
│       ├── security/                 # JwtAuthenticationFilter, JwtService, MySecurity
│       └── modules/
│           ├── auth/                 # Đăng nhập, đăng ký, JWT
│           ├── users/                # Hồ sơ, wishlist
│           ├── products/             # Sản phẩm, biến thể, hình ảnh
│           ├── cart/                 # Giỏ hàng
│           ├── orders/               # Đơn hàng, lịch sử
│           ├── reviews/              # Đánh giá sản phẩm
│           ├── voucher/              # Mã giảm giá
│           ├── chatbox/              # Chat AI, FAQ, session
│           ├── luckywheel/           # Vòng quay, giải thưởng
│           ├── vnpay/                # Cổng thanh toán VNPay
│           ├── adminUser/            # Admin: người dùng
│           ├── adminProduct/         # Admin: sản phẩm
│           ├── adminOrder/           # Admin: đơn hàng
│           ├── adminPayment/         # Admin: thanh toán & analytics
│           ├── adminchatbox/         # Admin: cấu hình chatbot
│           └── adminlukywheel/       # Admin: quản lý trò chơi
│
└── frontend/                         # React Application
    └── src/
        ├── Pages/                    # Trang người dùng
        ├── admin/                    # Trang quản trị
        ├── components/               # Component dùng chung
        ├── hooks/                    # Custom React hooks
        ├── services/                 # API services, axios
        ├── context/                  # CartContext, CacheProvider
        └── types/                    # TypeScript models
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- **Java 17+**
- **Maven 3.8+**
- **Node.js 18+** và **npm**
- Kết nối internet (database dùng Supabase cloud)

### 1. Clone dự án

```bash
git clone <repository-url>
cd ecommerce-handmade
```

### 2. Chạy Backend

```bash
cd backend
./mvnw spring-boot:run
# Hoặc trên Windows:
mvnw.cmd spring-boot:run
```

Backend khởi động tại: `http://localhost:8080`

### 3. Chạy Frontend

```bash
cd frontend
npm install
npm start
```

Frontend khởi động tại: `http://localhost:3000`

> Frontend tự proxy API calls đến `localhost:8080` (cấu hình trong `package.json`).

### 4. Chạy đồng thời (tùy chọn)

```bash
cd frontend
npm run dev    # Chạy cả React app và mock API server song song
```

---

## ⚙️ Biến môi trường

### Backend (`application.properties`)

| Key | Mô tả |
|---|---|
| `server.port` | Port backend (mặc định: 8080) |
| `spring.datasource.url` | JDBC URL của PostgreSQL (Supabase) |
| `spring.datasource.username` | Username database |
| `spring.datasource.password` | Password database |
| `vnpay.tmn-code` | Merchant code VNPay sandbox |
| `vnpay.hash-secret` | Secret key VNPay |
| `vnpay.return-url` | URL callback sau thanh toán |
| `groq.api.key` | API key Groq AI (có thể set qua env `GROQ_API_KEY`) |
| `groq.model` | Model AI (mặc định: `llama-3.1-8b-instant`) |
| `app.frontend-url` | URL frontend cho CORS |

### Frontend (`.env`)

| Key | Mô tả |
|---|---|
| `REACT_APP_API_URL` | Base URL của backend API |
| `REACT_APP_GROQ_API_KEY` | API key Groq AI (client-side chat) |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập, trả JWT |
| POST | `/api/auth/forgot-password` | Yêu cầu reset mật khẩu |

### Products
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm (có filter, phân trang) |
| GET | `/api/products/{id}` | Chi tiết sản phẩm |
| GET | `/api/products/category/{category}` | Sản phẩm theo danh mục |

### Cart
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/cart` | Lấy giỏ hàng |
| POST | `/api/cart/add` | Thêm sản phẩm vào giỏ |
| PUT | `/api/cart/update` | Cập nhật số lượng |
| POST | `/api/cart/merge` | Merge cart ẩn danh sau đăng nhập |

### Orders
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/orders` | Tạo đơn hàng |
| GET | `/api/orders/my` | Lịch sử đơn hàng của tôi |
| GET | `/api/orders/{id}` | Chi tiết đơn hàng |

### Payment (VNPay)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/payment/vnpay/create` | Tạo link thanh toán VNPay |
| GET | `/api/payment/vnpay/return` | Callback xử lý kết quả thanh toán |
| POST | `/api/payment/vnpay/ipn` | IPN webhook từ VNPay |

### Chatbox
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/chat/message` | Gửi tin nhắn, nhận phản hồi AI |
| GET | `/api/chat/history/{sessionId}` | Lịch sử chat theo session |
| WS | `/ws` | WebSocket endpoint (STOMP) |

### Lucky Wheel
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/prizes` | Danh sách giải thưởng |
| POST | `/api/luckywheel/spin` | Quay vòng quay |

### Admin
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/users` | Danh sách người dùng |
| GET | `/api/admin/orders` | Danh sách đơn hàng (có filter) |
| GET | `/api/admin/orders/export` | Xuất đơn hàng ra Excel |
| GET | `/api/admin/analytics` | Dữ liệu thống kê doanh thu |
| PUT | `/api/admin/orders/{id}` | Cập nhật trạng thái đơn |
| POST | `/api/admin/products` | Tạo sản phẩm mới |
| PUT | `/api/admin/chat/config` | Cập nhật cấu hình AI chatbot |

---

## 🧩 Module Backend chi tiết

### `auth` — Xác thực
- Đăng ký tài khoản với mã hóa mật khẩu BCrypt
- Đăng nhập trả về JWT access token
- `JwtAuthenticationFilter` xác thực mọi request qua header `Authorization: Bearer <token>`
- Phân quyền ROLE_USER / ROLE_ADMIN

### `products` — Sản phẩm
- Entity: `Product`, `ProductImage` (nhiều ảnh), `ProductVariant` (biến thể màu/size)
- Hỗ trợ lọc theo danh mục, khoảng giá, tên
- Phân trang kết quả
- Projection để tối ưu query

### `cart` — Giỏ hàng
- Lưu cart theo user (đã đăng nhập) hoặc session (ẩn danh)
- Tự động merge cart ẩn danh khi user đăng nhập

### `orders` — Đơn hàng
- Tạo đơn từ giỏ hàng, tự động trừ tồn kho
- Lưu `OrderHistory` mỗi khi trạng thái thay đổi
- `OrderSpecification` hỗ trợ query động với nhiều filter
- Áp dụng voucher giảm giá khi tạo đơn

### `chatbox` — Chatbot AI
- `AiChatService`: gọi Groq API (Llama 3.1) với context hội thoại
- `ChatService`: quản lý session, lưu tin nhắn vào DB
- Hỗ trợ session ẩn danh với timeout 30 phút
- Scheduler tự động dọn dẹp session cũ
- Fallback sang FAQ khi Groq API không khả dụng
- Cấu hình AI (prompt, temperature, model) lưu DB, admin thay đổi qua UI

### `luckywheel` — Vòng quay may mắn
- Mỗi user có `UserSpinProfile` theo dõi số lần quay còn lại
- Admin cấu hình danh sách phần thưởng (`Prize`) và xác suất
- Logic random có trọng số để chọn phần thưởng

### `vnpay` — Thanh toán
- Dùng **Strategy pattern** (`VNPayPaymentStrategy`)
- Tạo URL thanh toán với chữ ký HMAC-SHA512
- Xử lý callback `return` và `IPN` webhook từ VNPay
- Cập nhật trạng thái đơn hàng sau khi thanh toán thành công

### `adminOrder` — Quản lý đơn hàng
- Lọc đơn hàng đa tiêu chí: trạng thái, ngày, khách hàng
- Thống kê tổng hợp (`AdminOrderSummaryResponse`)
- Xuất danh sách đơn hàng ra file Excel (Apache POI)

---

## 🖥️ Frontend Pages chi tiết

### Trang người dùng

| Trang | Đường dẫn | Mô tả |
|---|---|---|
| Trang chủ | `/` | Banner, sản phẩm nổi bật |
| Danh sách sản phẩm | `/products` | Lưới sản phẩm, sidebar lọc |
| Chi tiết sản phẩm | `/products/:id` | Ảnh zoom, biến thể, đánh giá |
| Giỏ hàng | `/cart` | Xem, sửa giỏ hàng |
| Thanh toán | `/checkout` | Form địa chỉ, chọn thanh toán |
| Kết quả VNPay | `/payment/vnpay/return` | Xử lý callback thanh toán |
| Thanh toán thành công | `/payment/success` | Trang xác nhận |
| Đăng nhập | `/login` | Form đăng nhập |
| Đăng ký | `/register` | Form tạo tài khoản |
| Quên mật khẩu | `/forgot-password` | Khôi phục tài khoản |
| Hồ sơ | `/profile` | Xem/sửa thông tin cá nhân |
| Lịch sử đơn hàng | `/orders` | Danh sách đơn hàng |
| Chi tiết đơn hàng | `/orders/:id` | Theo dõi từng đơn |
| Danh sách yêu thích | `/wishlist` | Sản phẩm đã lưu |
| Vòng quay may mắn | `/lucky-wheel` | Giao diện quay thưởng |
| Chat AI | `/chat` | Giao diện chatbox |
| Về chúng tôi | `/about` | Giới thiệu thương hiệu |
| Thông tin giao hàng | `/delivery` | Chính sách giao hàng |

### Trang quản trị (Admin)

| Trang | Đường dẫn | Mô tả |
|---|---|---|
| Dashboard | `/admin` | Thống kê tổng quan |
| Analytics | `/admin/analytics` | Biểu đồ doanh thu, đơn hàng |
| Sản phẩm | `/admin/products` | CRUD sản phẩm, biến thể |
| Đơn hàng | `/admin/orders` | Quản lý, lọc, xuất Excel |
| Người dùng | `/admin/users` | Quản lý tài khoản, phân quyền |
| Trò chơi | `/admin/games` | Cấu hình vòng quay, giải thưởng |
| Khuyến mãi | `/admin/promotions` | Quản lý voucher |
| Cài đặt AI | `/admin/settings` | Cấu hình chatbot, FAQ |

---

## 🗂️ Danh mục sản phẩm

| Mã danh mục | Tên hiển thị |
|---|---|
| `do_da` | Đồ da |
| `gom_su` | Gốm sứ |
| `my_pham` | Mỹ phẩm |
| `phu_kien` | Phụ kiện |
| `trang_suc` | Trang sức |
| `trang_tri` | Đồ trang trí |
| `tui_vi` | Túi & ví |
| `van_phong_pham` | Văn phòng phẩm |

---

## 🔐 Bảo mật

- Tất cả password được hash bằng **BCrypt**
- Xác thực API qua **JWT Bearer Token** (header `Authorization`)
- Các endpoint admin yêu cầu role `ROLE_ADMIN`
- CORS chỉ cho phép origin từ `http://localhost:3000` (cấu hình qua `app.cors-allowed-origins`)
- Chữ ký thanh toán VNPay dùng **HMAC-SHA512**
- Kết nối database PostgreSQL qua **SSL** (Supabase)

---

## 📦 Build & Deploy

### Build Backend
```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/handmade-api-0.0.1-SNAPSHOT.jar
```

### Build Frontend
```bash
cd frontend
npm run build
# Output tại frontend/build/
```

Frontend có sẵn cấu hình `vercel.json` để deploy lên **Vercel**.

---

## 👥 Thành viên nhóm

> *(Cập nhật thông tin thành viên tại đây)*

---

*Dự án được xây dựng trong khuôn khổ môn học Công nghệ Web.*
