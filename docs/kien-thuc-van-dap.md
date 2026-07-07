# 🎯 Kiến thức cần nắm vững để vấn đáp tốt

> Tài liệu này gắn trực tiếp với code dự án **E-Commerce Handmade Store**.
> Mỗi khái niệm đều có ví dụ từ file thực tế trong project.

---

## PHẦN 1 — FRONTEND & BẤT ĐỒNG BỘ

### 1.1 React Hooks cốt lõi

#### `useState`

- Mỗi lần `setState` → component **re-render**
- State là **bất đồng bộ** — không đọc giá trị mới ngay sau `setState`
- Dùng functional update khi state mới phụ thuộc state cũ:

```typescript
setPage(p => p + 1)   // ĐÚNG — dùng giá trị hiện tại
setPage(page + 1)     // SAI nếu trong closure cũ
```

#### `useEffect`

```typescript
// MyReviews.tsx — fetch khi tab hoặc page thay đổi
useEffect(() => {
    if (tab === 'pending') fetchPending(pendingPage);
    else fetchCompleted(completedPage);
}, [tab, pendingPage, completedPage, fetchPending, fetchCompleted]);
```

| Dependency array | Khi nào chạy |
|-----------------|-------------|
| Không có | Sau mỗi lần render |
| `[]` rỗng | Chỉ 1 lần khi component mount |
| `[a, b]` | Mỗi khi `a` hoặc `b` thay đổi |

- Return cleanup function để tránh memory leak (unsubscribe, clearTimeout, AbortController)

#### `useCallback`

```typescript
// Memoize function — chỉ tạo lại khi userId thay đổi
const fetchPending = useCallback(async (p: number) => {
    setLoading(true);
    try {
        const res = await fetch(`/api/reviews/users/${currentUser.id}/pending?page=${p}&size=5`,
            { headers: { Authorization: getAuthToken() } });
        if (!res.ok) { setError(`Lỗi ${res.status}`); return; }
        setPendingData(await res.json());
    } catch {
        setError('Không thể kết nối máy chủ.');
    } finally {
        setLoading(false);
    }
}, [currentUser.id]);
```

**Tại sao cần useCallback ở đây?**
> Nếu không dùng `useCallback`, mỗi lần render tạo ra function mới → `useEffect` thấy dependency thay đổi → chạy lại → vòng lặp vô hạn.

#### `useContext`

```typescript
// CartContext — chia sẻ state giỏ hàng toàn app
const { cartItems, addToCart, removeFromCart } = useContext(CartContext);
```

---

### 1.2 Bất đồng bộ JavaScript

#### Async/Await và Promise

```typescript
// Async/Await — code đọc tuần tự, dễ hiểu hơn
const submitReview = async () => {
    setSubmitting(true);
    try {
        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: getAuthToken() },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setSubmitMsg('Đánh giá đã được gửi!');
        } else {
            const txt = await res.text();
            setSubmitErr(JSON.parse(txt)?.message || 'Lỗi');
        }
    } catch {
        setSubmitErr('Lỗi kết nối');
    } finally {
        setSubmitting(false); // luôn chạy dù thành công hay thất bại
    }
};
```

**`finally` dùng để làm gì?** → Luôn chạy dù có exception hay không → dùng để tắt loading spinner.

#### Axios Interceptors (`api.ts`)

```typescript
// Request interceptor — tự động đính JWT vào MỌI request
api.interceptors.request.use(config => {
    const token = getTokenFromStorage();
    if (token) config.headers.Authorization = token;
    return config;
});

// Response interceptor — xử lý 401 toàn cục
api.interceptors.response.use(
    response => response,
    error => {
        if (error?.response?.status === 401) {
            localStorage.removeItem('user');  // tự động logout
        }
        return Promise.reject(error);
    }
);
```

**Tại sao dùng Axios thay vì fetch thuần?**
| Tính năng | fetch | axios |
|-----------|-------|-------|
| Interceptors | ❌ | ✅ |
| Auto JSON parse | ❌ | ✅ |
| Timeout config | ❌ | ✅ |
| Cancel request | Phức tạp | Đơn giản |
| Error on 4xx/5xx | ❌ (cần check manually) | ✅ |

---

### 1.3 React Router

```typescript
// App.tsx — Protected Route kiểm tra đăng nhập và role
const ProtectedRoute = ({ children, currentUser }) => {
    if (!currentUser) return <Navigate to="/login" replace />;
    const isAdmin = currentUser.roles?.includes('ROLE_ADMIN');
    if (!isAdmin) return <Navigate to="/" replace />;
    return <>{children}</>;
};
```

- `useParams()` — lấy `:id` từ URL trong `ProductDetail.tsx`
- `useNavigate()` — redirect sau submit form
- `replace` trong Navigate — không lưu vào history (không bấm Back được)

---

### 1.4 TypeScript Patterns trong dự án

```typescript
// Generic interface
interface PagedData<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

// Generic state
const [pendingData, setPendingData] = useState<PagedData<PendingItem> | null>(null);

// Type narrowing
const data = await res.json();
if (Array.isArray(data)) setPending(data);
```

---

## PHẦN 2 — SPRING BOOT MVC

### 2.1 Luồng request hoàn chỉnh

```
HTTP Request
  ↓
JwtAuthenticationFilter     ← parse JWT, set SecurityContext
  ↓
Spring Security Filter      ← kiểm tra hasRole / permitAll
  ↓
@RestController             ← nhận request, validate input cơ bản
  ↓
@Service                    ← business logic, @Transactional
  ↓
@Repository (JPA)           ← truy vấn DB
  ↓
HTTP Response
```

#### Trách nhiệm từng lớp

| Lớp | Làm gì | KHÔNG làm gì |
|-----|--------|-------------|
| **Controller** | Nhận request, map params/body, gọi Service, trả response | Không có logic nghiệp vụ |
| **Service** | Business logic, validation, transaction | Không query DB trực tiếp |
| **Repository** | Chỉ tương tác DB | Không có logic |

---

### 2.2 DTO Pattern — Tại sao không trả Entity trực tiếp

```java
// Entity — bảng DB, có thể có password hash, foreign keys
@Entity @Table(name = "reviews")
public class ReviewEntity {
    Long id; Long userId; Long orderItemId; Integer rating; ...
}

// DTO — chỉ trả những gì FE cần
public class ReviewResponse {
    Long id;
    String userName;  // đã JOIN với User để lấy tên
    Integer rating;
    String comment;
    LocalDateTime createdAt;
}
```

**3 lý do dùng DTO:**
1. Tránh lộ thông tin nhạy cảm (password, internal IDs)
2. Tránh circular reference khi serialize JSON (quan hệ 2 chiều)
3. Linh hoạt format dữ liệu trả về (computed fields, rename...)

---

### 2.3 HTTP Status Codes cần biết

| Code | Ý nghĩa | Dùng khi |
|------|---------|---------|
| `200 OK` | Thành công | GET thành công |
| `201 Created` | Tạo mới thành công | POST tạo review |
| `400 Bad Request` | Dữ liệu sai | Thiếu userId, rating ngoài 1-5 |
| `401 Unauthorized` | Chưa đăng nhập | Không có JWT |
| `403 Forbidden` | Không có quyền | Review đơn người khác |
| `404 Not Found` | Không tìm thấy | OrderItem không tồn tại |
| `409 Conflict` | Xung đột | Đã review rồi |

---

## PHẦN 3 — JPA / HIBERNATE

### 3.1 Quan hệ Entity

```java
// One-to-Many: Order có nhiều OrderItem
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
List<OrderItem> items = new ArrayList<>();

// Many-to-One: OrderItem thuộc về 1 Order
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "order_id", nullable = false)
Order order;
```

**Giải thích từng annotation:**
- `mappedBy = "order"` — Order không giữ FK, OrderItem giữ FK `order_id`
- `cascade = CascadeType.ALL` — save/delete Order tự áp dụng xuống OrderItem
- `orphanRemoval = true` — remove OrderItem khỏi list → xóa khỏi DB
- `FetchType.LAZY` — chỉ load khi `order.getItems()` được gọi

**LAZY vs EAGER:**

| | LAZY | EAGER |
|-|------|-------|
| Load khi | Truy cập thuộc tính | Cùng lúc với entity cha |
| Hiệu năng | Tốt hơn (chỉ load khi cần) | Có thể chậm với data lớn |
| N+1 problem | Có thể xảy ra | Ít hơn |
| Giải pháp N+1 | Dùng `JOIN FETCH` trong JPQL | — |

---

### 3.2 Custom Queries

```java
// JPQL — làm việc với Entity class
@Query("SELECT new ReviewResponse(r.id, r.userId, u.fullName, ...) " +
       "FROM ReviewEntity r " +
       "JOIN User u ON r.userId = u.id " +  // JOIN với entity khác
       "WHERE r.productId = :productId " +
       "ORDER BY r.createdAt DESC")
Page<ReviewResponse> findPagedReviewsByProductId(@Param("productId") Long id, Pageable pageable);

// Native SQL — làm việc với bảng thật
@Query(value = "SELECT MAX(pi.image_url) FROM product_images pi WHERE pi.product_id = ?1 LIMIT 1",
       nativeQuery = true)
```

**`new ReviewResponse(...)` trong JPQL** — Constructor Projection: chỉ select đúng field cần, không load toàn bộ entity → tối ưu hiệu năng.

**Tại sao cần `countQuery` riêng khi dùng Page?**
> Spring tự sinh count query từ data query, nhưng nếu query có JOIN phức tạp, count query tự sinh sẽ sai. Khai báo `countQuery` riêng đảm bảo đếm đúng.

---

### 3.3 `@Transactional`

```java
// Write operation — rollback nếu bất kỳ bước nào fail
@Transactional
public ReviewResponse createReview(ReviewRequest request) {
    // Bước 1: validate
    // Bước 2: save review
    ReviewEntity saved = reviewRepository.save(entity);
    // Nếu exception ở đây → save bên trên cũng bị rollback
    return reviewRepository.findReviewResponseById(saved.getId());
}

// Read operation — tắt dirty checking, không flush → nhanh hơn
@Transactional(readOnly = true)
public PagedResponse<PendingReviewItemDTO> getPendingReviews(Long userId, int page, int size) { ... }
```

**Tại sao đặt `@Transactional` ở Service không phải Controller?**
> Controller chỉ điều phối request/response. Transaction là business concern → thuộc Service. Nếu Controller gọi nhiều Service method, mỗi method có transaction riêng → không atomic.

---

### 3.4 JPA Specification

```java
// Cho phép filter động theo N điều kiện kết hợp tùy ý
Specification<Order> spec = Specification.where(null);

if (status != null)
    spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
if (fromDate != null)
    spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));

orderRepository.findAll(spec, PageRequest.of(page, size));
```

**Tại sao không viết nhiều query method?**
> 5 filter kết hợp = 2^5 = 32 query method khác nhau. Specification giải quyết với 1 method + compose dynamically.

---

## PHẦN 4 — BẢO MẬT

### 4.1 JWT — Hoạt động chi tiết

```
Cấu trúc: header.payload.signature

header:    { "alg": "HS256", "typ": "JWT" }  → base64url
payload:   { "sub": "123", "roles": ["ROLE_USER"], "exp": 1234567890 }  → base64url
signature: HMAC_SHA256(header + "." + payload, secret_key)
```

**Flow đầy đủ:**
```
1. POST /api/auth/login { username, password }
   ← JwtService.generateToken(username, roles) → token string

2. Client lưu token:
   localStorage.setItem('authHeader', 'Bearer ' + token)

3. Mọi request tiếp theo:
   Authorization: Bearer eyJhbGci...

4. JwtAuthenticationFilter.java:
   - Lấy token từ header
   - JwtService.validateToken(token)
   - JwtService.extractUsername(token) → set SecurityContext
   - Spring Security tiếp tục kiểm tra quyền
```

**JWT vs Session:**

| | JWT | Session |
|-|-----|---------|
| Lưu trữ | Client (localStorage) | Server (DB/memory) |
| Stateless | ✅ Có | ❌ Không |
| Scale | Dễ (không shared state) | Cần sticky session |
| Revoke token | Khó (cần blacklist) | Dễ (xóa khỏi DB) |
| Kích thước | Lớn hơn (chứa claims) | Nhỏ (chỉ session ID) |

**Tại sao localStorage không phải HttpOnly cookie?**
> HttpOnly cookie bảo mật hơn (JS không đọc được, tránh XSS). Tuy nhiên có CSRF risk. Dự án dùng localStorage + CSRF disabled vì REST API stateless.

---

### 4.2 Spring Security Rule Order

```java
// MySecurity.java — thứ tự từ trên xuống, rule đầu match áp dụng
.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()           // 1. CORS preflight — PHẢI đầu tiên
.requestMatchers("/api/auth/**").permitAll()                      // 2. Public auth
.requestMatchers(HttpMethod.GET, "/api/reviews/products/**").permitAll()  // 3. Public reads
.requestMatchers(HttpMethod.GET, "/api/reviews/users/**").hasAnyRole("USER","ADMIN")  // 4. Cần auth
.requestMatchers(HttpMethod.POST, "/api/reviews/**").hasAnyRole("USER","ADMIN")
.requestMatchers("/api/admin/**").hasRole("ADMIN")               // 5. Admin only
.anyRequest().authenticated()                                     // 6. Mặc định cần auth
```

**Tại sao OPTIONS phải đầu tiên?**
> Browser gửi OPTIONS request (CORS preflight) trước khi gửi request thật. Nếu OPTIONS bị chặn bởi rule bảo mật → request thật không bao giờ được gửi → app không hoạt động.

---

### 4.3 BCrypt

```java
// Mã hóa khi đăng ký
passwordEncoder.encode("rawPassword123")
// → "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
// → mỗi lần hash cho kết quả khác nhau (do salt ngẫu nhiên)

// Xác minh khi đăng nhập — không cần decode
passwordEncoder.matches("rawPassword123", hashedFromDB)  // → true/false
```

**Tại sao BCrypt khác nhau mỗi lần?**
> BCrypt tự động sinh random salt và nhúng vào hash string. `matches()` tách salt ra rồi hash lại để so sánh.

---

### 4.4 CORS

```
Vấn đề: Frontend (port 3000) gọi API Backend (port 8080)
→ Browser áp dụng Same-Origin Policy → chặn request
→ Cần CORS headers để Browser cho phép
```

```java
// CorsConfig.java
config.setAllowedOrigins(List.of("http://localhost:3000"));
config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
config.setAllowedHeaders(List.of("*"));
config.setAllowCredentials(true);  // cho phép gửi Authorization header
```

---

## PHẦN 5 — KIẾN TRÚC & DESIGN PATTERNS

### 5.1 Strategy Pattern (VNPay Module)

```java
// 1. Interface chung
public interface PaymentStrategy {
    PaymentResponseDto createPayment(PaymentRequestDto request);
    boolean verifyCallback(Map<String, String> params);
}

// 2. Concrete Strategy
public class VNPayPaymentStrategy implements PaymentStrategy {
    public PaymentResponseDto createPayment(...) {
        // xây dựng URL + HMAC-SHA512 hash
    }
}

// 3. Factory quyết định strategy
public class PaymentFactory {
    public PaymentStrategy get(String method) {
        if ("VNPAY".equals(method)) return vnPayStrategy;
        // Thêm MoMo, ZaloPay → chỉ cần thêm case, không sửa code cũ
        throw new UnsupportedOperationException();
    }
}
```

**Open/Closed Principle:** Mở để mở rộng (thêm phương thức thanh toán mới), đóng để sửa đổi (không sửa Factory).

---

### 5.2 Repository Pattern

```java
// Chỉ khai báo interface — Spring tự generate implementation
@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    // Derived query từ tên method
    boolean existsByOrderItemId(Long orderItemId);
    List<ReviewEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Custom JPQL
    @Query("SELECT new ReviewResponse(...) FROM ReviewEntity r JOIN User u ...")
    Page<ReviewResponse> findPagedReviewsByProductId(..., Pageable pageable);
}
```

---

### 5.3 Caching — Tại sao cần Cache Eviction

```java
// Đọc — cache hit nếu đã có
@Cacheable(value = "reviews", key = "#productId")
public List<ReviewResponse> getReviewsByProductId(Long productId) {
    return reviewRepository.findReviewsByProductId(productId);
    // Lần 1: query DB, lưu cache
    // Lần 2+: trả từ cache, không query DB
}

// Ghi — xóa cache cũ để lần đọc sau lấy data mới
@Caching(evict = {
    @CacheEvict(value = "reviews", key = "#request.productId"),  // xóa cache reviews
    @CacheEvict(value = "products", key = "'all'")              // xóa cache products
})
public ReviewResponse createReview(ReviewRequest request) { ... }
```

**Nếu không evict thì sao?**
> User vừa submit review → GET lại product sẽ thấy data cũ (cache chưa có review mới) → inconsistent data.

---

## PHẦN 6 — CÂU HỎI & ĐÁP ÁN MẪU

### Frontend

**Q: `useEffect` vs `useCallback` khác gì?**
> `useEffect` là side effect chạy sau khi render (fetch, subscribe...). `useCallback` là memoize một function để không tạo lại mỗi render. Trong dự án, `fetchPending` wrap bằng `useCallback` → đưa vào dependency `useEffect` tránh vòng lặp vô hạn.

**Q: Tại sao trong Pagination component dùng `p === page ? 'active' : ''` thay vì so sánh trực tiếp?**
> Đây là TypeScript type narrowing — `pages` array có thể là `number | '...'`. So sánh `p === page` với `p as number` đảm bảo type safety.

**Q: localStorage.getItem('authHeader') có thể bị XSS tấn công không?**
> Có — JS độc hại có thể đọc được. Giải pháp an toàn hơn là HttpOnly cookie. Dự án dùng localStorage vì đơn giản hóa cho đồ án, trong production nên dùng cookie.

---

### Backend

**Q: Khi nào nên dùng `@Transactional(readOnly = true)`?**
> Mọi method chỉ đọc dữ liệu (GET). `readOnly = true` tắt dirty checking (Hibernate không theo dõi thay đổi entity) và không flush session → giảm overhead, tăng tốc độ.

**Q: `cascade = CascadeType.ALL` có nguy hiểm không?**
> Có nếu dùng sai. Ví dụ: `CascadeType.REMOVE` trên `Order → OrderItem` → xóa Order tự xóa hết OrderItem (đây là đúng). Nhưng nếu dùng với `@ManyToOne` từ chiều nhiều → có thể xóa nhầm entity cha.

**Q: Tại sao đặt `@Transactional` ở Service chứ không phải Controller?**
> Controller chỉ điều phối request/response — không phải nơi xử lý business logic. Transaction là business concern. Nếu Controller gọi 2 Service methods, mỗi method có transaction riêng → không atomic → partial update nếu lỗi giữa chừng.

**Q: Sự khác biệt giữa `findById()` và `getById()` trong JPA?**
> `findById()` trả `Optional<T>` — cần handle empty case. `getById()` (deprecated → dùng `getReferenceById()`) trả proxy — throw `EntityNotFoundException` khi access. `findById()` thường an toàn hơn.

---

### JPA

**Q: N+1 problem là gì và cách giải quyết trong dự án?**
> N+1: query lấy 10 Order, rồi mỗi Order lại query thêm để lấy OrderItem → 1 + 10 = 11 queries.
> Giải pháp: dùng `JOIN FETCH` trong JPQL hoặc `@EntityGraph`.
> Trong `OrderItemRepository.java`:
> ```java
> @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order o WHERE o.userId = :userId ...")
> List<OrderItem> findCompletedOrderItemsByUserId(@Param("userId") Long userId);
> ```

**Q: Tại sao dùng `Specification` thay vì nhiều `@Query`?**
> Admin filter đơn hàng có thể filter theo: status, userId, fromDate, toDate, paymentMethod → 5 điều kiện = 32 query method. Specification compose động từ N conditions → 1 method duy nhất.

---

### Bảo mật

**Q: JWT có thể bị giả mạo không?**
> Không — nếu không có `secret_key`. Signature được tạo bằng `HMAC_SHA256(header + payload, secret)`. Kẻ tấn công có thể decode payload (base64) nhưng không thể tạo signature hợp lệ nếu không có secret.

**Q: Tại sao cần `allowCredentials = true` trong CORS?**
> Mặc định CORS không gửi credentials (cookie, Authorization header). Với `allowCredentials = true` → Browser cho phép gửi `Authorization: Bearer token` trong cross-origin request từ localhost:3000 đến localhost:8080.

**Q: Nếu token bị lộ thì làm sao revoke?**
> JWT stateless → không thể revoke trực tiếp. Giải pháp: (1) Token blacklist trong Redis, (2) Giảm expiry time, (3) Dùng refresh token + revoke refresh token. Dự án đồ án chưa implement revocation — đây là điểm có thể cải thiện.

---

### Thiết kế

**Q: Tại sao đánh giá theo `order_item_id` thay vì `user_id + product_id`?**
> Nếu theo `user_id + product_id`: user mua sản phẩm 2 lần (2 đơn khác nhau) chỉ đánh giá được 1 lần → thiếu công bằng.
> Theo `order_item_id`: mỗi lần mua là 1 `OrderItem` duy nhất → mỗi lần mua được đánh giá 1 lần → hợp lý hơn.

**Q: PagedResponse custom vs Spring's Page interface?**
> Spring `Page<T>` khi serialize JSON ra nhiều field không cần thiết (`pageable.sort`, `pageable.offset`...). `PagedResponse<T>` custom chỉ trả đúng field FE cần: `content`, `page`, `size`, `totalElements`, `totalPages` → clean API.
