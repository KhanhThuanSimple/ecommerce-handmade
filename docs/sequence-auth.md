# Sequence Diagram — Đăng ký & Đăng nhập

---

## LUỒNG 1 — ĐĂNG KÝ (Register)

```
User        Register.tsx    AuthService.ts    AuthController    AuthService.java    UserRepository    RoleRepository    Database
 |               |                |                 |                  |                  |                 |               |
 |--[điền form]->|                |                 |                  |                  |                 |               |
 |               |                |                 |                  |                  |                 |               |
 |               |--POST /api/auth/register-------->|                  |                  |                 |               |
 |               |   {email,username,password,      |                  |                  |                 |               |
 |               |    fullName,phone}               |                  |                  |                 |               |
 |               |                |                 |                  |                  |                 |               |
 |               |                |                 |--register(req)-->|                  |                 |               |
 |               |                |                 |                  |                  |                 |               |
 |               |                |                 |                  |--existsByEmail-->|                 |               |
 |               |                |                 |                  |                  |--SELECT email-->|               |
 |               |                |                 |                  |                  |<--false---------| (chưa tồn tại)|
 |               |                |                 |                  |                  |                 |               |
 |               |                |                 |                  |--findByName("ROLE_USER")---------->|               |
 |               |                |                 |                  |                  |                 |--SELECT role->|
 |               |                |                 |                  |                  |                 |<--Role object-|
 |               |                |                 |                  |<--Role("ROLE_USER")----------------|               |
 |               |                |                 |                  |                  |                 |               |
 |               |                |                 |                  |--BCrypt.encode(password)           |               |
 |               |                |                 |                  |  → "$2a$10$..."                    |               |
 |               |                |                 |                  |                  |                 |               |
 |               |                |                 |                  |--save(newUser)-->|                 |               |
 |               |                |                 |                  |                  |--INSERT users-->|               |
 |               |                |                 |                  |                  |--INSERT user_roles              |
 |               |                |                 |                  |                  |<--savedUser-----|               |
 |               |                |                 |                  |                  |                 |               |
 |               |                |                 |<-"Đăng ký thành công!"--------------|                 |               |
 |               |<--200 OK "Đăng ký thành công!"--|                  |                  |                 |               |
 |<--thông báo---|                |                 |                  |                  |                 |               |
 |   thành công  |                |                 |                  |                  |                 |               |
```

### Trường hợp Email đã tồn tại:
```
 |               |                |                 |                  |                  |                 |               |
 |               |                |                 |                  |--existsByEmail-->|                 |               |
 |               |                |                 |                  |<--true-----------|  (đã tồn tại)   |               |
 |               |                |                 |<-"Lỗi: Email đã tồn tại!"          |                 |               |
 |               |<--400 Bad Request---------------|                  |                  |                 |               |
 |<--hiện lỗi----|                |                 |                  |                  |                 |               |
```

---

## LUỒNG 2 — ĐĂNG NHẬP (Login)

```
User      Login.tsx    useLogin.ts    AuthService.ts    AuthController    AuthService.java    AuthManager    UserDetailsSvc    JwtService    Database
 |            |              |               |                 |                  |               |                |              |            |
 |--[nhập]--->|              |               |                 |                  |               |                |              |            |
 |            |              |               |                 |                  |               |                |              |            |
 |            |--handleSubmit(email, pwd)--->|                 |                  |               |                |              |            |
 |            |              |               |                 |                  |               |                |              |            |
 |            |              |--POST /api/auth/login---------->|                  |               |                |              |            |
 |            |              |   {email, password}            |                  |               |                |              |            |
 |            |              |               |                 |--login(req)----->|               |                |              |            |
 |            |              |               |                 |                  |               |                |              |            |
 |            |              |               |                 |                  |--authenticate(email, rawPwd)   |              |            |
 |            |              |               |                 |                  |               |                |              |            |
 |            |              |               |                 |                  |               |--loadUserByUsername(email)    |            |
 |            |              |               |                 |                  |               |                |--findByEmail->|            |
 |            |              |               |                 |                  |               |                |  (DB query)  |            |
 |            |              |               |                 |                  |               |                |<--User obj---|            |
 |            |              |               |                 |                  |               |<--UserDetails--|              |            |
 |            |              |               |                 |                  |               |                |              |            |
 |            |              |               |                 |                  |               |--BCrypt.matches(rawPwd, hash) |            |
 |            |              |               |                 |                  |               |  → true / false|              |            |
 |            |              |               |                 |                  |               |                |              |            |
 |            |              |               |   [Nếu sai pwd] |                  |               |                |              |            |
 |            |              |               |                 |                  |<--BadCredentialsException------|              |            |
 |            |              |               |<--401 Unauthorized-----------------|               |                |              |            |
 |            |<--lỗi--------|               |                 |                  |               |                |              |            |
 |            |              |               |                 |                  |               |                |              |            |
 |            |              |               |   [Nếu đúng pwd]|                  |               |                |              |            |
 |            |              |               |                 |                  |<--Authentication object--------|              |            |
 |            |              |               |                 |                  |                                |              |            |
 |            |              |               |                 |                  |--generateToken(user)---------->|              |            |
 |            |              |               |                 |                  |                                |--HMAC-SHA256--|            |
 |            |              |               |                 |                  |<--"eyJhbGci...token"-----------|              |            |
 |            |              |               |                 |                  |                                |              |            |
 |            |              |               |                 |<--AuthResponse{ id, email, token, roles }---------|              |            |
 |            |              |               |<--200 OK { id, email, token, roles }                               |              |            |
 |            |              |               |                 |                  |                                |              |            |
 |            |              |--localStorage.setItem('user', user)                |                               |              |            |
 |            |              |--localStorage.setItem('authHeader', 'Bearer token')|                               |              |            |
 |            |              |               |                 |                  |                                |              |            |
 |            |              |--mergeCart(userId)---------->[CartService]         |                               |              |            |
 |            |              |--refreshCart()------------>[CartService]           |                               |              |            |
 |            |              |               |                 |                  |                                |              |            |
 |            |              |--navigate('/admin') nếu ROLE_ADMIN                 |                               |              |            |
 |            |              |--navigate('/')      nếu ROLE_USER                  |                               |              |            |
 |<--redirect--|              |               |                 |                  |                                |              |            |
```

---

## LUỒNG 3 — REQUEST CÓ TOKEN (Mọi request sau khi đăng nhập)

```
User    axios/api.ts    JwtAuthFilter    JwtService    UserDetailsSvc    SecurityContext    MySecurity    Controller
 |            |               |               |                |                |               |              |
 |--action--->|               |               |                |                |               |              |
 |            |               |               |                |                |               |              |
 |            |--interceptor tự đính token    |                |                |               |              |
 |            |  Authorization: Bearer eyJ..  |                |                |               |              |
 |            |               |               |                |                |               |              |
 |            |--HTTP Request---------------->|                |                |               |              |
 |            |               |               |                |                |               |              |
 |            |               |--extractUsername(token)------->|                |               |              |
 |            |               |               |--parse JWT     |                |               |              |
 |            |               |               |--verify sig    |                |               |              |
 |            |               |               |<--"user@gmail" |                |               |              |
 |            |               |               |                |                |               |              |
 |            |               |--loadUserByUsername(email)---->|                |               |              |
 |            |               |               |                |--findByEmail-->|               |              |
 |            |               |               |                |  (DB + roles)  |               |              |
 |            |               |               |                |<--User+roles---|               |              |
 |            |               |               |                |                |               |              |
 |            |               |--isTokenValid(token, user)     |                |               |              |
 |            |               |  (email match + not expired)   |                |               |              |
 |            |               |               |                |                |               |              |
 |            |               |--setAuthentication(user, roles)---------------->|               |              |
 |            |               |               |                |                |               |              |
 |            |               |--filterChain.doFilter()--------|----------------|-------------->|              |
 |            |               |               |                |                |               |              |
 |            |               |               |   [Kiểm tra quyền]             |               |              |
 |            |               |               |                |                |  .hasRole("ADMIN")?          |
 |            |               |               |                |                |  .permitAll()?               |
 |            |               |               |                |                |               |              |
 |            |               |               |   [Nếu không đủ quyền]         |               |              |
 |            |               |               |                |                |               |--403-------->|
 |            |<--403 Forbidden---------------|----------------|----------------|               |              |
 |            |               |               |                |                |               |              |
 |            |               |               |   [Nếu đủ quyền]               |               |              |
 |            |               |               |                |                |               |--OK--------->|
 |            |               |               |                |                |               |              |--xử lý-->
```

---

## Mermaid — Đăng ký

```mermaid
sequenceDiagram
    actor User
    participant FE as Register.tsx
    participant AC as AuthController
    participant AS as AuthService
    participant UR as UserRepository
    participant RR as RoleRepository
    participant DB as Database

    User->>FE: Điền form (email, username, password)
    FE->>AC: POST /api/auth/register
    AC->>AS: register(RegisterRequest)

    AS->>UR: existsByEmail(email)
    UR->>DB: SELECT * FROM users WHERE email=?
    DB-->>UR: false (chưa tồn tại)
    UR-->>AS: false

    AS->>RR: findByName("ROLE_USER")
    RR->>DB: SELECT * FROM roles WHERE name='ROLE_USER'
    DB-->>RR: Role object
    RR-->>AS: Role("ROLE_USER")

    AS->>AS: BCrypt.encode(password) → hash

    AS->>UR: save(newUser)
    UR->>DB: INSERT INTO users (...)
    UR->>DB: INSERT INTO user_roles (user_id, role_id)
    DB-->>UR: savedUser
    UR-->>AS: savedUser

    AS-->>AC: "Đăng ký thành công!"
    AC-->>FE: 200 OK
    FE-->>User: Thông báo thành công → chuyển trang Login
```

---

## Mermaid — Đăng nhập

```mermaid
sequenceDiagram
    actor User
    participant FE as Login.tsx / useLogin.ts
    participant AC as AuthController
    participant AS as AuthService
    participant AM as AuthenticationManager
    participant UDS as UserDetailsServiceImpl
    participant JS as JwtService
    participant DB as Database

    User->>FE: Nhập email + password → submit
    FE->>AC: POST /api/auth/login {email, password}
    AC->>AS: login(LoginRequest)

    AS->>AM: authenticate(email, rawPassword)
    AM->>UDS: loadUserByUsername(email)
    UDS->>DB: SELECT * FROM users WHERE email=?
    DB-->>UDS: User + roles (EAGER)
    UDS-->>AM: UserDetails

    AM->>AM: BCrypt.matches(rawPwd, hashedPwd)

    alt Sai mật khẩu
        AM-->>AS: BadCredentialsException
        AS-->>AC: throw exception
        AC-->>FE: 401 Unauthorized
        FE-->>User: "Đăng nhập thất bại"
    else Đúng mật khẩu
        AM-->>AS: Authentication object (User principal)

        AS->>JS: generateToken(user)
        JS->>JS: HMAC-SHA256(sub+iat+exp, secret)
        JS-->>AS: JWT token string

        AS-->>AC: AuthResponse {id, email, fullName, token, roles}
        AC-->>FE: 200 OK {id, email, token, ["ROLE_USER"]}

        FE->>FE: localStorage.setItem('user', user)
        FE->>FE: localStorage.setItem('authHeader', 'Bearer token')
        FE->>FE: mergeCart(userId) + refreshCart()

        alt roles có ROLE_ADMIN
            FE-->>User: navigate('/admin')
        else ROLE_USER
            FE-->>User: navigate('/')
        end
    end
```

---

## Mermaid — Request sau khi đăng nhập

```mermaid
sequenceDiagram
    actor User
    participant AX as axios (api.ts interceptor)
    participant JF as JwtAuthenticationFilter
    participant JS as JwtService
    participant UDS as UserDetailsServiceImpl
    participant SC as SecurityContext
    participant MS as MySecurity (rules)
    participant CT as Controller

    User->>AX: Gọi API (ví dụ: xem review của mình)

    Note over AX: Interceptor tự đính token
    AX->>JF: GET /api/reviews/users/5/pending\nAuthorization: Bearer eyJ...

    JF->>JS: extractUsername(token)
    JS->>JS: parse JWT, verify signature
    JS-->>JF: "user@gmail.com"

    JF->>UDS: loadUserByUsername("user@gmail.com")
    UDS-->>JF: User {roles: [ROLE_USER]}

    JF->>JS: isTokenValid(token, user)
    JS-->>JF: true (email match + not expired)

    JF->>SC: setAuthentication(user, [ROLE_USER])

    JF->>MS: filterChain.doFilter() → kiểm tra quyền
    MS->>MS: .hasAnyRole("USER","ADMIN") ?
    MS->>MS: ROLE_USER ✓ → cho phép

    MS->>CT: forward request
    CT-->>AX: 200 OK {data}
    AX-->>User: hiển thị dữ liệu

    Note over JF,MS: Nếu token hết hạn → 401
    Note over JF,MS: Nếu không đủ role → 403
```
