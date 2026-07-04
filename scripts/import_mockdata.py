#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================
  IMPORT MOCK DATA → PostgreSQL
  Handmade Ecommerce — ecommerce_handmade_dev
=============================================================

Chạy:
  python scripts/import_mockdata.py

Yêu cầu:
  pip install psycopg2-binary bcrypt

Logic:
  - Mỗi bảng kiểm tra EXISTS trước khi INSERT → bỏ qua nếu đã có
  - Thứ tự import đảm bảo FK: roles → users → categories → products
    → product_variants → reviews → vouchers → prizes → faq_items
=============================================================
"""

import json
import os
import sys
import traceback
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("❌  Thiếu psycopg2. Cài: pip install psycopg2-binary")
    sys.exit(1)

try:
    import bcrypt
except ImportError:
    print("❌  Thiếu bcrypt. Cài: pip install bcrypt")
    sys.exit(1)

# ─────────────────────────────────────────────
# CẤU HÌNH KẾT NỐI — khớp application.properties
# ─────────────────────────────────────────────
DB_CONFIG = {
    "host":     "localhost",
    "port":     5432,
    "dbname":   "ecommerce_handmade_dev",
    "user":     "postgres",
    "password": "123456",
}

# ─────────────────────────────────────────────
# ĐƯỜNG DẪN GỐC MOCK DATA
# ─────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
MOCK_DIR     = PROJECT_ROOT / "frontend" / "src" / "mock-data"
PRODUCT_DIR  = MOCK_DIR / "products"

# ─────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────
def load_json(path: Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def log_ok(msg):  print(f"  ✅  {msg}")
def log_skip(msg): print(f"  ⏭️   {msg}")
def log_warn(msg): print(f"  ⚠️   {msg}")

# ─────────────────────────────────────────────
# 1. ROLES
# ─────────────────────────────────────────────
def seed_roles(cur):
    print("\n📌 Roles")
    roles = [
        ("ROLE_ADMIN", "Quản trị viên", "#7c3aed"),
        ("ROLE_USER",  "Khách hàng",     "#1d4ed8"),
    ]
    for name, display, color in roles:
        cur.execute("SELECT 1 FROM roles WHERE name = %s", (name,))
        if cur.fetchone():
            log_skip(f"Role '{name}' đã tồn tại")
        else:
            cur.execute(
                "INSERT INTO roles (name, display_name, color) VALUES (%s, %s, %s)",
                (name, display, color)
            )
            log_ok(f"Thêm role '{name}'")

# ─────────────────────────────────────────────
# 2. USERS (mock + admin mặc định)
# ─────────────────────────────────────────────
def seed_users(cur):
    print("\n👤 Users")

    # Lấy role_id
    cur.execute("SELECT id FROM roles WHERE name = 'ROLE_ADMIN'")
    admin_role_id = cur.fetchone()
    cur.execute("SELECT id FROM roles WHERE name = 'ROLE_USER'")
    user_role_id = cur.fetchone()

    if not admin_role_id or not user_role_id:
        log_warn("Chưa có roles — bỏ qua seed users")
        return

    admin_role_id = admin_role_id[0]
    user_role_id  = user_role_id[0]

    # Admin mặc định
    admin_email = "admin@handmade.com"
    cur.execute("SELECT 1 FROM users WHERE email = %s", (admin_email,))
    if cur.fetchone():
        log_skip("Admin user đã tồn tại")
    else:
        cur.execute(
            """INSERT INTO users (username, email, full_name, password, enabled, active)
               VALUES (%s, %s, %s, %s, TRUE, TRUE) RETURNING id""",
            ("admin", admin_email, "Quản trị viên hệ thống", hash_password("Admin@123"))
        )
        new_id = cur.fetchone()[0]
        cur.execute("INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)", (new_id, admin_role_id))
        log_ok("Thêm admin@handmade.com")

    # Mock users
    try:
        mock_users = load_json(MOCK_DIR / "users.json")
    except FileNotFoundError:
        log_warn("Không tìm thấy users.json")
        return

    for u in mock_users:
        email = u.get("email", "").strip()
        if not email:
            continue
        cur.execute("SELECT 1 FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            log_skip(f"User '{email}' đã tồn tại")
        else:
            username = u.get("username") or email.split("@")[0]
            plain_pw = u.get("password", "123456")
            cur.execute(
                """INSERT INTO users (username, email, full_name, password, enabled, active)
                   VALUES (%s, %s, %s, %s, TRUE, TRUE) RETURNING id""",
                (username, email, username, hash_password(plain_pw))
            )
            new_id = cur.fetchone()[0]
            cur.execute("INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)", (new_id, user_role_id))
            log_ok(f"Thêm user '{email}'")

# ─────────────────────────────────────────────
# 3. CATEGORIES
# ─────────────────────────────────────────────
def seed_categories(cur):
    print("\n📂 Categories")
    try:
        cats = load_json(MOCK_DIR / "categories.json")
    except FileNotFoundError:
        log_warn("Không tìm thấy categories.json")
        return

    for c in cats:
        cur.execute("SELECT 1 FROM categories WHERE id = %s", (c["id"],))
        if cur.fetchone():
            log_skip(f"Category id={c['id']} '{c['name']}' đã tồn tại")
        else:
            cur.execute(
                "INSERT INTO categories (id, name) VALUES (%s, %s)",
                (c["id"], c["name"])
            )
            log_ok(f"Thêm category '{c['name']}'")

# ─────────────────────────────────────────────
# 4. PRODUCTS + PRODUCT_VARIANTS
# ─────────────────────────────────────────────
def seed_products(cur):
    print("\n📦 Products")
    product_files = list(PRODUCT_DIR.glob("*.json"))
    if not product_files:
        log_warn("Không tìm thấy file nào trong products/")
        return

    total_inserted = 0
    total_skipped  = 0

    for pf in sorted(product_files):
        try:
            products = load_json(pf)
        except Exception as e:
            log_warn(f"Lỗi đọc {pf.name}: {e}")
            continue

        for p in products:
            pid = p.get("id")
            if pid is None:
                continue

            cur.execute("SELECT 1 FROM products WHERE id = %s", (pid,))
            if cur.fetchone():
                total_skipped += 1
                continue

            name       = p.get("name", "")
            price      = float(p.get("price", 0))
            image_url  = p.get("imageUrl", "")
            description = p.get("description", "")
            inventory  = int(p.get("inventory", 0))
            category_id = p.get("categoryId")

            # Kiểm tra FK category tồn tại
            if category_id:
                cur.execute("SELECT 1 FROM categories WHERE id = %s", (category_id,))
                if not cur.fetchone():
                    category_id = None

            cur.execute(
                """INSERT INTO products (id, name, price, image_url, description, inventory, category_id)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (pid, name, price, image_url, description, inventory, category_id)
            )

            # Tạo 1 variant mặc định
            cur.execute(
                """INSERT INTO product_variants (product_id, sku, name, price, stock)
                   VALUES (%s, %s, %s, %s, %s)
                   ON CONFLICT (sku) DO NOTHING""",
                (pid, f"SKU-{pid}", "Mặc định", price, inventory)
            )

            total_inserted += 1

    log_ok(f"Đã thêm {total_inserted} sản phẩm, bỏ qua {total_skipped} đã tồn tại")

# ─────────────────────────────────────────────
# 5. REVIEWS
# ─────────────────────────────────────────────
def seed_reviews(cur):
    print("\n⭐ Reviews")
    try:
        reviews = load_json(MOCK_DIR / "reviews.json")
    except FileNotFoundError:
        log_warn("Không tìm thấy reviews.json")
        return

    # Lấy mapping username → user_id từ DB
    cur.execute("SELECT id, username FROM users")
    user_map = {row[1].lower(): row[0] for row in cur.fetchall()}

    inserted = skipped = 0
    for r in reviews:
        rid = str(r.get("id", ""))
        cur.execute("SELECT 1 FROM reviews WHERE id = %s", (rid,))
        if cur.fetchone():
            skipped += 1
            continue

        product_id = r.get("productId")
        if product_id:
            cur.execute("SELECT 1 FROM products WHERE id = %s", (product_id,))
            if not cur.fetchone():
                skipped += 1
                continue

        username = (r.get("userName") or "").lower()
        user_id  = user_map.get(username)

        # Parse createdAt "HH:MM:SS dd/mm/yyyy"
        raw_date = r.get("createdAt", "")
        created_at = None
        try:
            if raw_date:
                parts = raw_date.split(" ")
                if len(parts) == 2:
                    time_part, date_part = parts
                    d, m, y = date_part.split("/")
                    created_at = f"{y}-{m}-{d} {time_part}"
        except Exception:
            pass

        cur.execute(
            """INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (rid, product_id, user_id, r.get("userName"), r.get("rating"), r.get("comment"), created_at)
        )
        inserted += 1

    log_ok(f"Đã thêm {inserted} reviews, bỏ qua {skipped}")

# ─────────────────────────────────────────────
# 6. VOUCHERS
# ─────────────────────────────────────────────
def seed_vouchers(cur):
    print("\n🎟️  Vouchers")
    try:
        vouchers = load_json(MOCK_DIR / "voucher.json")
    except FileNotFoundError:
        log_warn("Không tìm thấy voucher.json")
        return

    inserted = skipped = 0
    for v in vouchers:
        vid = v.get("id")
        cur.execute("SELECT 1 FROM vouchers WHERE id = %s", (vid,))
        if cur.fetchone():
            skipped += 1
            continue

        # Normalize status cho phép DB
        raw_status = v.get("status", "ACTIVE")
        status = raw_status if raw_status in ("ACTIVE", "INACTIVE", "EXPIRED") else "INACTIVE"

        # target normalize
        raw_target = v.get("target", "ALL")
        target = raw_target if raw_target in ("ALL", "SPECIFIC_USER", "LUCKY_WHEEL", "NEW_USER", "LOYAL_USER", "VIP_USER") else "ALL"

        cur.execute(
            """INSERT INTO vouchers
               (id, code, title, voucher_type, value_amount, max_discount_amount,
                min_order_amount, usage_limit, used_count, user_id, target,
                status, start_date, expired_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                vid,
                v.get("code"),
                v.get("title"),
                v.get("type", "FIXED"),
                v.get("value", 0),
                v.get("maxDiscount"),
                v.get("minOrder", 0),
                v.get("quantity", 0),
                v.get("used", 0),
                v.get("userId"),
                target,
                status,
                v.get("startDate"),
                v.get("expiredAt"),
            )
        )
        inserted += 1

    log_ok(f"Đã thêm {inserted} vouchers, bỏ qua {skipped}")

# ─────────────────────────────────────────────
# 7. PRIZES (Lucky Wheel)
# ─────────────────────────────────────────────
def seed_prizes(cur):
    print("\n🎡 Prizes (Lucky Wheel)")
    try:
        prizes = load_json(MOCK_DIR / "prizes.json")
    except FileNotFoundError:
        log_warn("Không tìm thấy prizes.json")
        return

    # Kiểm tra bảng tồn tại
    cur.execute("SELECT to_regclass('public.prizes')")
    if cur.fetchone()[0] is None:
        log_warn("Bảng 'prizes' chưa tồn tại — bỏ qua")
        return

    inserted = skipped = 0
    for p in prizes:
        pid = p.get("id")
        cur.execute("SELECT 1 FROM prizes WHERE id = %s", (pid,))
        if cur.fetchone():
            skipped += 1
            continue
        cur.execute(
            """INSERT INTO prizes (id, name, type, value, color, text_color, icon, description, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)""",
            (
                pid,
                p.get("name"),
                p.get("type"),
                p.get("value", 0),
                p.get("color"),
                p.get("textColor"),
                p.get("icon"),
                p.get("description"),
            )
        )
        inserted += 1

    log_ok(f"Đã thêm {inserted} prizes, bỏ qua {skipped}")

# ─────────────────────────────────────────────
# 8. FAQ ITEMS
# ─────────────────────────────────────────────
def seed_faq(cur):
    print("\n💬 FAQ Items")
    try:
        faqs = load_json(MOCK_DIR / "faq.json")
    except FileNotFoundError:
        log_warn("Không tìm thấy faq.json")
        return

    # Kiểm tra bảng
    cur.execute("SELECT to_regclass('public.faq_items')")
    if cur.fetchone()[0] is None:
        log_warn("Bảng 'faq_items' chưa tồn tại — bỏ qua")
        return

    inserted = skipped = 0
    for f in faqs:
        fid = f.get("id")
        cur.execute("SELECT 1 FROM faq_items WHERE id = %s", (fid,))
        if cur.fetchone():
            skipped += 1
            continue

        keywords = f.get("keywords", [])
        keywords_str = ",".join(keywords) if keywords else ""
        cur.execute(
            """INSERT INTO faq_items
               (id, keywords, action, target_category, category_id, response_text, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, TRUE)""",
            (
                fid,
                keywords_str,
                f.get("action"),
                f.get("targetCategory"),
                f.get("categoryId"),
                f.get("responseText"),
            )
        )
        inserted += 1

    log_ok(f"Đã thêm {inserted} FAQ items, bỏ qua {skipped}")

# ─────────────────────────────────────────────
# KIỂM TRA BẢNG TỒN TẠI (helper)
# ─────────────────────────────────────────────
def table_exists(cur, table_name: str) -> bool:
    cur.execute("SELECT to_regclass('public.%s')" % table_name)
    return cur.fetchone()[0] is not None

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  HANDMADE — Import Mock Data → PostgreSQL")
    print(f"  DB: {DB_CONFIG['dbname']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print("=" * 55)

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cur = conn.cursor()
        print("✅  Kết nối database thành công\n")
    except Exception as e:
        print(f"❌  Không thể kết nối DB: {e}")
        sys.exit(1)

    # Kiểm tra các bảng cốt lõi
    required = ["roles", "users", "user_roles", "categories", "products"]
    missing  = [t for t in required if not table_exists(cur, t)]
    if missing:
        print(f"\n❌  Các bảng sau chưa tồn tại: {missing}")
        print("   Hãy khởi động Spring Boot (ddl-auto=update) để tạo schema trước!")
        cur.close(); conn.close()
        sys.exit(1)

    try:
        seed_roles(cur)
        seed_users(cur)
        seed_categories(cur)
        seed_products(cur)
        seed_reviews(cur)
        seed_vouchers(cur)
        seed_prizes(cur)
        seed_faq(cur)

        conn.commit()
        print("\n" + "=" * 55)
        print("  🎉  Import hoàn tất — tất cả dữ liệu đã được lưu!")
        print("=" * 55)

    except Exception:
        conn.rollback()
        print("\n❌  Lỗi xảy ra — đã ROLLBACK toàn bộ thay đổi:")
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
