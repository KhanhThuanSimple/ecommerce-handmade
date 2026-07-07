# 📊 Thống kê Đồ án — E-Commerce Handmade Store

> **Tiêu chí chấm điểm:**
> - Kỹ thuật cơ bản (Frontend, Bất đồng bộ, MVC) — 3đ
> - Kỹ thuật nâng cao (Bảo mật, JPA, Validation, ...) — 3đ
> - Team work — 1đ
> - Trình bày — 1đ
> - Vấn đáp — 2đ

---

## Stack tổng quan

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | React 18 + TypeScript + React Router v6 |
| **Backend** | Spring Boot 3.2.4 + Java 17 |
| **Database** | PostgreSQL |
| **Authentication** | JWT (JJWT 0.11.5) |
| **Build tool** | Maven |
| **ORM** | Spring Data JPA / Hibernate |

---

## 1. Kỹ thuật cơ bản — 3đ

### 🖥️ Frontend (React + TypeScript)

#### 21 trang giao diện khách hàng

| Trang | Mô tả |
|-------|-------|
| `Home.tsx` | Trang chủ, hiển thị sản phẩm nổi bật |
| `Product.tsx` | Danh sách sản phẩm |
| `ProductGrid.tsx` | Grid layout hiển thị sản phẩm |
| `ProductSidebar.tsx` | Bộ lọc danh mục, giá |
| `ProductCard.tsx` | Card component cho từng sản phẩm |
| `ProductDetail.tsx` | Chi tiết sản phẩm, tab mô tả / thông số / đánh giá |
| `Cart.tsx` | Giỏ hàng |
| `Checkout.tsx` | Thanh toán |
| `DeliveryInfo.tsx` | Thông tin giao hàng |
| `OrderHistory.tsx` | Lịch sử đơn hàng |
| `OrderDetail.tsx` | Chi tiết từng đơn hàng |
| `Profile.tsx` | Trang cá nhân (info, voucher, review, đổi email/mật khẩu) |
| `Login.tsx` | Đăng nhập |
| `Register.tsx` | Đăng ký |
| `ForgotPassword.tsx` | Quên mật khẩu |
| `Wishlist.tsx` | Sản phẩm yêu thích |
| `LuckyWheel.tsx` | Vòng quay may mắn |
| `Chatbox.tsx` | Chat AI toàn màn hình |
| `ChatWidget.tsx` | Chat widget nổi góc màn hình |
| `VNPayReturn.tsx` | Xử lý callback VNPay |
| `PaymentSuccess.tsx` | Trang thành công thanh toán |
| `About.tsx` | Giới thiệu |

#### 7 trang Admin Panel

| Trang | Mô tả |
|-------|-------|
| `Dashboard` | Tổng quan doanh thu, đơn hàng |
| `Products` | Quản lý sản phẩm CRUD |
| `Users` | Quản lý người dùng |
| `Orders` | Quản lý đơn hàng, lọc theo trạng thái |
| `Analytics` | Thống kê doanh thu, xuất Excel |
| `Games` | Quản lý vòng quay may mắn |
| `Promotions` | Quản lý voucher khuyến mãi |
| `Settings` | Cấu hình AI chatbox |

#### Custom Hooks

| Hook | Mục đích |
|------|----------|
| `useProductDetail` | Logic trang chi tiết sản phẩm |
| `useProfile` | Logic trang cá nhân |
| `useLogin` | Logic đăng nhập + redirect theo role |
| `useProductFilter` | Lọc/tìm kiếm sản phẩm |

#### Context & State Management

- `CartContext` — quản lý giỏ hàng toàn app bằng React Context
- Global user state lưu `localStorage` và sync qua `App.tsx`
- Admin logout dispatch custom event `auth:logout`

#### Design System

- **`tokens.css`** — CSS Variables (60-30-10 color rule)
  - 60% nền kem ấm (`--surface-page`, `--surface-sunken`)
  - 30% bề mặt trắng card (`--surface-card`)
  - 10% brand accent (`--brand-primary`, `--brand-accent`)
- Font **Be Vietnam Pro** (hỗ trợ đầy đủ tiếng Việt)
- Spacing scale 4px base grid (`--sp-1` → `--sp-24`)
- Responsive breakpoints (`@media max-width: 640px / 768px / 900px`)

---

### ⚡ Bất đồng bộ (Async)

#### Axios Instance tập trung (`api.ts`)

```typescript
const api = axios.create({
    baseURL: '/api',
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — tự động đính JWT
api.interceptors.request.use(config => {
    const token = getTokenFromStorage();
    if (token) config.headers.Authorization = token;
    return config;
});

// Response interceptor — xử lý 401 toàn cục
api.interceptors.response.use(res => res, error => {
    if (error?.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('authHeader');
    }
    return Promise.reject(error);
});
```

#### Pattern async/await chuẩn trong dự án

```typescript
// MyReviews.tsx — fetch với loading/error state
const fetchPending = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
        const res = await fetch(
            `/api/reviews/users/${currentUser.id}/pending?page=${p}&size=5`,
            { headers: { Authorization: getAuthToken() } }
        );
        if (!res.ok) {
            setError(res.status === 401 ? 'Phiên đăng nhập hết hạn.' : `Lỗi ${res.status}`);
            return;
        }
        setPendingData(await res.json());
    } catch {
        setError('Không thể kết nối máy chủ.');
    } finally {
        setLoading(false); // luôn chạy
    }
}, [currentUser.id]);

// useEffect kết hợp useCallback
useEffect(() => {
    if (tab === 'pending') fetchPending(pendingPage);
    else fetchCompleted(completedPage);
}, [tab, pendingPage, completedPage, fetchPending, fetchCompleted]);
```

#### Các điểm async nổi bật

- VNPay callback xử lý redirect + query params bất đồng bộ
- Chat AI với Ollama — streaming response
- `ChatCleanupScheduler.java` — cron job tự động dọn session cũ
- `AbortController` / cancel token tránh memory leak khi navigate

---

### 🏗️ MVC Pattern (Spring Boot)

**18 modules backend**, mỗi module tuân thủ 3 lớp rõ ràng:

```
Controller → Service → Repository (JPA)
```

#### Tổng hợp lớp theo module

| Module | Controller | Service | Repository | Entity |
|--------|-----------|---------|-----------|--------|
| auth | AuthController | AuthService, UserDetailsServiceImpl | UserRepository, RoleRepository | User, Role |
| orders | OrderController | OrderService | OrderRepository, OrderItemRepository | Order, OrderItem, OrderHistory |
| products | ProductController | ProductService | ProductRepository, ProductVariantRepository | Product, ProductImage, ProductVariant |
| reviews | ReviewController | ReviewService | ReviewRepository | ReviewEntity |
| cart | CartController | CartService | CartRepository, CartItemRepository | Cart, CartItem |
| voucher | VoucherController | VoucherService | VoucherRepository | Voucher |
| chatbox | ChatController | ChatService, AiChatService, OllamaService | ChatSessionRepository, ChatMessageRepository, ChatFaqRepository | ChatSession, ChatMessage, ChatFaq |
| luckywheel | PrizeController | LuckyWheelService | PrizeRepository, UserSpinProfileRepository | Prize, UserSpinProfile |
| vnpay | PaymentController | — | — | — |
| users | UserController | UserService | UserWishlistRepository | UserWishlistItem |
| adminProduct | AdminProductController | AdminProductService | AdminProductRepository | — |
| adminOrder | AdminOrderController | AdminOrderService | — | — |
| adminUser | AdminUserController | AdminUserService | — | — |
| adminPayment | AdminAnalyticsController, AdminPaymentController | — | — | — |
| adminlukywheel | AdminLuckyWheelController, PrizeAdminController | AdminLuckyWheelService | — | — |
| adminchatbox | AdminChatConfigController, ChatFaqAdminController | AdminChatConfigService, AiConfigService | AiConfigurationRepository | AiConfiguration |

#### DTO Pattern — tách biệt Entity và Response

- Không bao giờ trả Entity trực tiếp ra ngoài
- Mỗi module có riêng Request DTO và Response DTO
- **30+ DTO classes** tổng cộng

---

## 2. Kỹ thuật nâng cao — 3đ

### 🔒 Bảo mật (Security)

#### JWT Authentication Flow

```
1. POST /api/auth/login (username + password)
   → AuthService xác thực BCrypt
   → JwtService tạo token (HMAC-SHA256, 24h expiry)
   → Trả AuthResponse { id, email, token, roles }

2. Client lưu token vào localStorage
   → axios interceptor tự đính: Authorization: Bearer <token>

3. Mọi request có token
   → JwtAuthenticationFilter.java parse token
   → Set SecurityContext với userId + roles
   → Spring Security kiểm tra quyền theo rules
```

#### Spring Security Rules (`MySecurity.java`)

```java
// Thứ tự từ trên xuống, rule đầu match sẽ áp dụng
.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()          // CORS preflight
.requestMatchers("/api/auth/**").permitAll()                     // đăng nhập/ký
.requestMatchers(HttpMethod.GET, "/api/products/**").permitAll() // xem sản phẩm public
.requestMatchers(HttpMethod.GET, "/api/reviews/products/**").permitAll()
.requestMatchers(HttpMethod.GET, "/api/reviews/users/**").hasAnyRole("USER","ADMIN")
.requestMatchers(HttpMethod.POST, "/api/reviews/**").hasAnyRole("USER","ADMIN")
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.anyRequest().authenticated()
```

#### Các kỹ thuật bảo mật áp dụng

| Kỹ thuật | Mô tả | File |
|----------|-------|------|
| BCryptPasswordEncoder | Hash mật khẩu một chiều | `MySecurity.java` |
| JWT Stateless | Không lưu session server | `JwtService.java` |
| RBAC | Phân quyền USER/ADMIN | `MySecurity.java` |
| CORS Config | Chỉ cho phép origin `localhost:3000` | `CorsConfig.java` |
| Custom 401/403 | Trả JSON thay vì redirect | `MySecurity.java` |
| CSRF disabled | REST API stateless không cần CSRF | `MySecurity.java` |
| VNPay HMAC-SHA512 | Xác thực callback thanh toán | `VNPayConfig.java` |

---

### 🗄️ JPA / Hibernate

#### Quan hệ Entity

```java
// Order (1) ←→ OrderItem (nhiều)
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
@Builder.Default
List<OrderItem> items = new ArrayList<>();

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "order_id", nullable = false)
Order order;
```

#### Custom JPQL Queries (`ReviewRepository.java`)

```java
// JOIN cross-entity + constructor projection + pagination
@Query(value =
    "SELECT new ReviewResponse(r.id, r.userId, u.fullName, r.productId, r.rating, r.comment, r.createdAt) " +
    "FROM ReviewEntity r " +
    "JOIN com.handmade...User u ON r.userId = u.id " +
    "WHERE r.productId = :productId ORDER BY r.createdAt DESC",
    countQuery = "SELECT COUNT(r) FROM ReviewEntity r WHERE r.productId = :productId")
Page<ReviewResponse> findPagedReviewsByProductId(@Param("productId") Long productId, Pageable pageable);
```

#### Native SQL Query (`ProductRepository.java`)

```java
@Query(value = "SELECT p.id, p.name, p.base_price, c.name AS categoryName, " +
               "MAX(pi.image_url) AS imageUrl, " +
               "CAST(COALESCE(SUM(pv.inventory), 0) AS INTEGER) AS totalInventory, " +
               "CAST(COALESCE(AVG(r.rating), 5.0) AS FLOAT) AS rating " +
               "FROM products p " +
               "INNER JOIN categories c ON p.category_id = c.id " +
               "LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = TRUE " +
               "LEFT JOIN product_variants pv ON p.id = pv.product_id " +
               "LEFT JOIN reviews r ON p.id = r.product_id " +
               "GROUP BY p.id, p.name, ...",
               nativeQuery = true)
```

#### JPA Specification — Dynamic Filtering

```java
// OrderSpecification.java — filter đơn hàng theo nhiều điều kiện
Specification<Order> spec = Specification.where(null);
if (status != null)
    spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
if (userId != null)
    spec = spec.and((root, q, cb) -> cb.equal(root.get("userId"), userId));
orderRepository.findAll(spec, pageable);
```

#### Pagination

```java
// Backend nhận page/size từ request params
@RequestParam(defaultValue = "0") int page,
@RequestParam(defaultValue = "5") int size

// Tạo PageRequest và lấy Page<T>
Page<ReviewResponse> reviewPage = reviewRepository
    .findPagedReviewsByProductId(productId, PageRequest.of(page, size));

// Wrap lại PagedResponse<T> custom
return new PagedResponse<>(
    reviewPage.getContent(),   // list dữ liệu trang hiện tại
    page, size,
    reviewPage.getTotalElements(),
    reviewPage.getTotalPages()
);
```

#### `@Transactional` Usage

```java
@Transactional            // write operation — rollback nếu exception
public ReviewResponse createReview(ReviewRequest request) { ... }

@Transactional(readOnly = true)  // read-only — tắt dirty checking, tối ưu hiệu năng
public PagedResponse<PendingReviewItemDTO> getPendingReviews(...) { ... }
```

#### Audit Timestamps

```java
@CreationTimestamp
@Column(name = "created_at", updatable = false)
private LocalDateTime createdAt;

@UpdateTimestamp
@Column(name = "updated_at")
private LocalDateTime updatedAt;

// Hoặc @PrePersist manual
@PrePersist
protected void onCreate() {
    if (this.createdAt == null) this.createdAt = LocalDateTime.now();
}
```

#### Projection Interface

```java
// CartItemProjection — chỉ select đúng field cần, không load toàn entity
public interface CartItemProjection {
    Long getProductId();
    String getProductName();
    Double getPrice();
    String getImageUrl();
    Integer getQuantity();
}
```

---

### ✅ Validation

#### Backend — Business Validation (Service Layer)

```java
// ReviewService.java
if (request.getUserId() == null || request.getProductId() == null)
    throw new ResponseStatusException(BAD_REQUEST, "Thiếu userId hoặc productId");

if (request.getRating() < 1 || request.getRating() > 5)
    throw new ResponseStatusException(BAD_REQUEST, "Đánh giá phải từ 1 đến 5 sao");

if (!orderItemRepository.existsByOrderItemId(request.getOrderItemId()))
    // đã review rồi
    throw new ResponseStatusException(CONFLICT, "Bạn đã đánh giá sản phẩm này trong đơn đó rồi");

if (!oi.getOrder().getUserId().equals(request.getUserId()))
    throw new ResponseStatusException(FORBIDDEN, "Đơn hàng không thuộc về bạn");
```

#### Backend — Bean Validation (`spring-boot-starter-validation`)

Dependency có trong `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

#### Frontend Validation

```typescript
// Modal submit review
if (!comment.trim()) {
    setSubmitErr('Vui lòng nhập nội dung đánh giá.');
    return;
}

// Kiểm tra response status
if (!res.ok) {
    const txt = await res.text();
    let msg = 'Có lỗi khi gửi đánh giá.';
    try { msg = JSON.parse(txt)?.message || msg; } catch { msg = txt || msg; }
    setSubmitErr(msg);
}
```

---

### ⚡ Caching

```java
// CacheConfig.java — hỗ trợ Simple Cache hoặc Redis (config qua properties)

// Đọc từ cache nếu có, nếu không thì query DB rồi lưu cache
@Cacheable(value = "reviews", key = "#productId")
public List<ReviewResponse> getReviewsByProductId(Long productId) { ... }

// Xóa cache sau khi tạo review mới — đảm bảo data mới nhất
@Caching(evict = {
    @CacheEvict(value = "reviews", key = "#request.productId"),
    @CacheEvict(value = "products", key = "#request.productId"),
    @CacheEvict(value = "products", key = "'all'")
})
public ReviewResponse createReview(ReviewRequest request) { ... }
```

Config trong `application.properties`:
```properties
# Simple in-memory cache (không cần Redis)
spring.autoconfigure.exclude=...RedisAutoConfiguration...
app.cache.type=simple

# Hoặc bật Redis
# spring.data.redis.host=localhost
# spring.data.redis.port=6379
```

---

### 💳 Tích hợp VNPay — Strategy Pattern

```java
// Interface
public interface PaymentStrategy {
    PaymentResponseDto createPayment(PaymentRequestDto request);
}

// Implementation
public class VNPayPaymentStrategy implements PaymentStrategy {
    // HMAC-SHA512 hash để ký request
    // Xác thực checksum trong callback
}

// Factory quyết định dùng strategy nào
public class PaymentFactory {
    public PaymentStrategy get(String method) {
        if ("VNPAY".equals(method)) return vnPayStrategy;
        throw new UnsupportedOperationException("Unsupported: " + method);
    }
}
```

**Lợi ích:** Thêm MoMo, ZaloPay không cần sửa code cũ — Open/Closed Principle.

---

### 🤖 AI Chatbox — Dual Engine

| Engine | Mô tả | Config |
|--------|-------|--------|
| **Groq API** | Cloud AI, nhanh | `groq.api.key`, `groq.model=llama-3.1-8b-instant` |
| **Ollama** | Local AI, offline | `ollama.enabled=true`, `ollama.model=my-chatbot` |

- **FAQ fallback** — khi AI không trả lời được → trả về câu hỏi thường gặp
- **Session management** — cả anonymous và logged-in user
- **ChatCleanupScheduler** — cron job tự xóa session hết hạn
- **WebSocket** — `spring-boot-starter-websocket` cho real-time

---

### 📊 Excel Export — Apache POI

```java
// AdminAnalyticsController.java
// Xuất báo cáo đơn hàng, doanh thu ra .xlsx
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.5</version>
</dependency>
```

---

### 🔄 Tính năng nghiệp vụ nổi bật

#### Đánh giá sản phẩm — Logic phức tạp

- User chỉ đánh giá được sản phẩm đã mua trong đơn hoàn thành
- Mua 2 đơn khác nhau → đánh giá 2 lần độc lập (theo `order_item_id`)
- Tab "Chưa đánh giá" + "Đã đánh giá" có phân trang riêng
- `ProductReviewsTab` trên ProductDetail: statistics (avg rating + distribution bars) + paginated list

#### Order Flow

```
Tạo đơn → COD: trừ kho ngay
         → VNPay: chờ thanh toán → callback IPN → trừ kho
         → Áp voucher (có try/catch nếu voucher lỗi, không hủy đơn)
         → Xóa sản phẩm khỏi giỏ hàng
```

#### Giỏ hàng

- Cart merge: guest cart → user cart khi đăng nhập
- Native SQL optimized để lấy cart items với JOIN

---

## 3. Team work — 1đ

| Chỉ số | Bằng chứng |
|--------|-----------|
| **Tổ chức module** | 18 modules backend độc lập, rõ trách nhiệm |
| **Tách biệt client/admin** | Frontend có 2 layout riêng (`MainLayout` / `AdminLayout`) |
| **Tài liệu** | `docs/sequence-diagrams.md` — flow diagram |
| **Seed data** | `scripts/seed_chatbox.sql`, `data/user-extras.json` |
| **Config tách môi trường** | `application.properties` có comment hướng dẫn rõ |
| **CSS tổ chức** | Mỗi component có CSS riêng, không conflict |

---

## 4. Tổng hợp điểm mạnh để trình bày

| Tiêu chí | Điểm mạnh |
|----------|-----------|
| **Frontend** | SPA React TypeScript, Custom Design System (tokens.css), 21 trang khách + Admin Panel |
| **Async** | Axios interceptors tự động JWT, useCallback/useEffect đúng pattern, error/loading states đầy đủ |
| **MVC** | Phân tầng 3 lớp rõ ràng, DTO pattern tách Entity, 18 modules |
| **Bảo mật** | JWT + BCrypt + RBAC + CORS + HMAC-SHA512 VNPay |
| **JPA** | JPQL + Native queries, JOIN cross-entity, Pageable, JpaSpecification, Projection |
| **Validation** | 2 lớp: business logic (Service throws exceptions) + input validation (frontend) |
| **Nâng cao** | Cache (Simple+Redis), VNPay HMAC, AI dual-engine, Excel export, WebSocket, Strategy Pattern, Scheduler |

---

## 5. Câu hỏi vấn đáp có thể được hỏi

### Về Frontend
- `useEffect` chạy khi nào? Dependency array rỗng `[]` nghĩa là gì?
- `useCallback` dùng để làm gì? Khi nào cần dùng?
- Tại sao dùng Axios thay vì `fetch` thuần?
- localStorage vs sessionStorage vs Cookie khác gì nhau?
- React Context vs Redux: khi nào dùng cái nào?

### Về Backend
- Tại sao đặt `@Transactional` ở Service chứ không phải Controller?
- `readOnly = true` trong `@Transactional` có tác dụng gì?
- Tại sao `FetchType.LAZY` thay vì `EAGER`?
- `CascadeType.ALL` vs `orphanRemoval = true` khác gì?

### Về JPA
- Tại sao `findPagedReviewsByProductId` cần khai báo `countQuery` riêng?
- `JpaSpecificationExecutor` dùng để làm gì? Lợi ích so với query method cứng?
- JPQL vs Native SQL — khi nào dùng cái nào?

### Về Bảo mật
- JWT hoạt động như thế nào? Khác Session ở chỗ nào?
- Tại sao OPTIONS request phải `permitAll` đầu tiên trong Security config?
- BCrypt hash mật khẩu — tại sao mỗi lần hash ra khác nhau nhưng vẫn verify được?
- HMAC-SHA512 trong VNPay dùng để bảo vệ điều gì?

### Về thiết kế
- Strategy Pattern trong VNPay áp dụng để làm gì?
- Tại sao không expose Entity trực tiếp ra Controller mà phải dùng DTO?
- Cache evict hoạt động như thế nào? Nếu không evict thì sẽ ra sao?
- Tại sao đánh giá theo `order_item_id` thay vì chỉ `user_id + product_id`?
