# Scripts — Handmade Ecommerce

## import_mockdata.py

Import toàn bộ dữ liệu từ `frontend/src/mock-data/` vào PostgreSQL.

### Dữ liệu được import

| Nguồn | Bảng DB | Ghi chú |
|-------|---------|---------|
| `categories.json` | `categories` | 8 danh mục |
| `products/*.json` | `products` + `product_variants` | ~80+ sản phẩm, tạo 1 variant mặc định mỗi SP |
| `users.json` | `users` + `user_roles` | Hash bcrypt password |
| *(tạo mới)* | `users` + `user_roles` | Admin `admin@handmade.com` / `Admin@123` |
| `voucher.json` | `vouchers` | 9 vouchers |
| `prizes.json` | `prizes` | 4 phần thưởng vòng quay |
| `faq.json` | `faq_items` | 16 FAQ entries |
| `reviews.json` | `reviews` | ~160 đánh giá |

**Logic:** Mỗi bản ghi kiểm tra `EXISTS` trước — **bỏ qua hoàn toàn nếu đã có**, không ghi đè.

### Yêu cầu

1. **Python 3.8+** đã được cài
2. Các thư viện:
   ```
   pip install psycopg2-binary bcrypt
   ```
3. **PostgreSQL** đang chạy, đã tạo database `ecommerce_handmade_dev`
4. **Spring Boot đã khởi động ít nhất 1 lần** (để Hibernate tạo schema)

### Cách chạy

```bash
# Từ thư mục gốc dự án
python scripts/import_mockdata.py
```

### Thay đổi cấu hình DB

Chỉnh sửa block `DB_CONFIG` đầu file nếu cần:

```python
DB_CONFIG = {
    "host":     "localhost",
    "port":     5432,
    "dbname":   "ecommerce_handmade_dev",
    "user":     "postgres",
    "password": "123456",
}
```

### Chạy lại an toàn

Script **idempotent** — có thể chạy nhiều lần mà không lo mất dữ liệu hay trùng lặp.
Các bản ghi đã tồn tại sẽ bị **bỏ qua** và in ra log `⏭️`.
