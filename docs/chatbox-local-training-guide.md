# Hướng dẫn Train Chatbox Chạy Local

## Tổng quan kiến trúc hiện tại

```
ChatWidget.tsx
    │
    ▼  POST /api/chat/ask
ChatController.java
    │
    ├─► AiChatService.java
    │       ├─► Groq Cloud API  (cần internet + API key)
    │       └─► FAQ fallback    (keyword matching trong DB)
    │
    └─► ChatService.java (session + lưu history)
```

**Vấn đề khi chạy local:**
- Groq là cloud API — cần internet và API key hợp lệ
- Không có AI "thật" chạy offline trong dự án hiện tại

---

## Lựa chọn training local

| Cách | Mô hình | Tài nguyên | Độ khó | Chất lượng |
|------|---------|------------|--------|-----------|
| **A** | FAQ thuần túy (sẵn có) | Không cần GPU | Dễ | Trả lời cứng |
| **B** | Ollama + LLaMA/Mistral | RAM 8GB+ | Trung bình | Tốt |
| **C** | Groq free tier (khuyến nghị) | Không cần GPU | Dễ | Rất tốt |

---

## CÁCH A — Tối ưu FAQ Fallback (không cần AI)

Đây là cách **nhanh nhất**, không cần cài gì thêm.  
Khi `GROQ_API_KEY` rỗng, `AiChatService.java` tự động dùng `getFallbackResponse()`.

### Bước 1 — Bỏ trống API key

Trong `application.properties`, để trống groq key:

```properties
groq.api.key=
```

Hoặc trong bảng `ai_configurations` (DB), để cột `GROQ_API_KEY` = `""`.

### Bước 2 — Thêm FAQ vào database

Chạy SQL này để seed dữ liệu FAQ từ mock data:

```sql
-- Xóa FAQ cũ (nếu muốn reset)
-- TRUNCATE TABLE chat_faqs;

-- Insert FAQ cơ bản
INSERT INTO chat_faqs (keywords, response_text, is_active) VALUES
('túi,ví,túi xách,túi đeo,clutch,balo',
 'Mời bạn tham khảo bộ sưu tập túi và ví handmade của shop tại trang Sản phẩm nhé! Shop có nhiều mẫu đẹp từ túi tote canvas đến ví da cao cấp.',
 TRUE),

('trang trí,decor,nhà cửa,đèn,tranh,đồ decor',
 'Shop có nhiều sản phẩm decor handmade giúp không gian thêm ấm cúng. Ghé mục Trang trí nhà cửa để xem đầy đủ nhé!',
 TRUE),

('phụ kiện,móc khóa,kẹp tóc,khăn,nón',
 'Shop có nhiều phụ kiện handmade xinh xắn. Ghé mục Phụ kiện để xem các mẫu mới nhất ạ!',
 TRUE),

('vòng tay,nhẫn,vòng cổ,khuyên tai,trang sức,jewelry',
 'Đây là những mẫu trang sức handmade tinh xảo. Shop nhận đặt khắc tên theo yêu cầu nha!',
 TRUE),

('gốm sứ,bình gốm,ly gốm,chén,đĩa,ceramic',
 'Các sản phẩm gốm sứ thủ công độc đáo đang có tại shop. Mỗi sản phẩm là một tác phẩm độc nhất vô nhị ạ!',
 TRUE),

('đồ da,ví da,túi da,thắt lưng,leather',
 'Shop có đồ da handmade chất lượng cao, dùng da bò nhập khẩu. Xem thêm tại mục Đồ da nhé!',
 TRUE),

('giá,bao nhiêu tiền,giá bao nhiêu,mắc không,rẻ không',
 'Giá sản phẩm handmade tùy thuộc chất liệu và độ thủ công. Bạn click vào từng sản phẩm để xem giá chi tiết nhé! Hoặc liên hệ shop để được tư vấn ạ.',
 TRUE),

('đặt làm riêng,custom,đặt theo yêu cầu,khắc tên,thiết kế riêng',
 'Shop có nhận đặt làm riêng và khắc tên theo yêu cầu 💝 Bạn nhắn tin cho shop với chi tiết yêu cầu, shop sẽ báo giá trong vòng 24 giờ!',
 TRUE),

('quà tặng,tặng sinh nhật,tặng người yêu,tặng bạn,gift,quà',
 'Sản phẩm handmade rất phù hợp làm quà tặng 🎁 Shop hỗ trợ gói quà miễn phí và viết thiệp theo yêu cầu!',
 TRUE),

('giao hàng,ship,vận chuyển,bao lâu nhận,phí ship',
 'Shop giao hàng toàn quốc 🚚 Thời gian nhận hàng 2-5 ngày tùy khu vực. Đơn từ 300k được miễn phí ship nội thành ạ!',
 TRUE),

('đổi trả,hoàn tiền,bảo hành,lỗi,hỏng',
 'Shop hỗ trợ đổi trả trong 7 ngày nếu sản phẩm bị lỗi do nhà sản xuất. Bạn liên hệ trực tiếp với shop để được hỗ trợ nhanh nhất nhé!',
 TRUE),

('khuyến mãi,giảm giá,sale,ưu đãi,voucher,mã giảm',
 'Shop thường xuyên có chương trình khuyến mãi vào dịp lễ 🎉 Bạn có thể thử vòng quay may mắn tại trang Games để nhận voucher miễn phí!',
 TRUE),

('thanh toán,chuyển khoản,cod,vnpay,trả tiền',
 'Shop hỗ trợ thanh toán COD (nhận hàng trả tiền) và VNPay. Bạn chọn phương thức phù hợp tại bước thanh toán nhé!',
 TRUE),

('chất liệu,làm bằng gì,nguyên liệu,an toàn,thân thiện môi trường',
 'Shop sử dụng chất liệu thân thiện môi trường và được chọn lọc kỹ 🌿 Tất cả đều an toàn và không gây hại. Chi tiết trong từng mô tả sản phẩm ạ!',
 TRUE),

('liên hệ,hotline,số điện thoại,email,zalo,facebook',
 'Bạn có thể liên hệ shop qua:\n📞 Hotline: 0909-xxx-xxx\n💬 Zalo: 0909-xxx-xxx\n📧 Email: handmade@shop.com\nShop phản hồi trong vòng 1 giờ ạ!',
 TRUE),

('xin chào,chào,hello,hi,hey,alo',
 'Chào bạn! 👋 Mình là trợ lý ảo của HandMade Shop. Mình có thể giúp bạn tìm sản phẩm, hỏi về giá, giao hàng hoặc đặt làm riêng. Bạn cần hỗ trợ gì ạ?',
 TRUE),

('cảm ơn,thanks,thank you,ok,được rồi',
 'Cảm ơn bạn đã ghé thăm HandMade Shop! 💝 Nếu cần thêm hỗ trợ, bạn cứ nhắn tin nhé. Chúc bạn mua sắm vui vẻ!',
 TRUE);
```

### Bước 3 — Cấu hình AiConfigService

Thêm cấu hình vào bảng `ai_configurations`:

```sql
INSERT INTO ai_configurations (config_key, config_value, description) VALUES
('GROQ_API_KEY', '', 'Để trống = dùng FAQ fallback'),
('SYSTEM_PROMPT', 'Bạn là trợ lý ảo của HandMade Shop, chuyên bán đồ thủ công mỹ nghệ. Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt.', 'Prompt hệ thống'),
('SHOP_ADDRESS', 'TP. Hồ Chí Minh, Việt Nam', 'Địa chỉ shop'),
('SHOP_POLICY', 'Đổi trả 7 ngày, giao hàng toàn quốc 2-5 ngày, miễn ship đơn từ 300k', 'Chính sách shop')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
```

**Kết quả:** Chat hoạt động offline hoàn toàn, trả lời dựa trên keyword matching.

---

---

## CÁCH B — Ollama + LLM chạy 100% offline (khuyến nghị cho máy mạnh)

Ollama cho phép chạy LLM hoàn toàn trên máy local, không cần internet.

### Yêu cầu phần cứng

| Mô hình | RAM tối thiểu | GPU | Chất lượng |
|---------|--------------|-----|-----------|
| `tinyllama` | 4 GB | Không cần | Cơ bản |
| `llama3.2:3b` | 4 GB | Không cần | Khá tốt |
| `mistral:7b` | 8 GB RAM / 6GB VRAM | Tùy chọn | Tốt |
| `llama3.1:8b` | 8 GB RAM / 8GB VRAM | Tùy chọn | Rất tốt |

### Bước 1 — Cài Ollama

```bash
# Windows: Tải installer tại
# https://ollama.com/download/windows

# Hoặc dùng winget
winget install Ollama.Ollama
```

### Bước 2 — Tải mô hình

Mở terminal, chạy:

```bash
# Mô hình nhẹ, phù hợp RAM 4GB
ollama pull llama3.2:3b

# Mô hình tốt hơn, cần RAM 8GB+
ollama pull mistral:7b

# Kiểm tra đã tải xong
ollama list
```

Ollama sẽ chạy server tại `http://localhost:11434`

### Bước 3 — Tạo model tiếng Việt cho shop

Tạo file `Modelfile` tại thư mục gốc dự án:

```
FROM llama3.2:3b

SYSTEM """
Bạn là trợ lý ảo của HandMade Shop - cửa hàng chuyên đồ thủ công mỹ nghệ tại Việt Nam.

NHIỆM VỤ:
- Tư vấn sản phẩm handmade: túi ví, trang sức, gốm sứ, đồ da, phụ kiện, decor nhà
- Hỗ trợ thông tin đơn hàng, giao hàng, đổi trả
- Giới thiệu chương trình khuyến mãi, voucher

THÔNG TIN SHOP:
- Giao hàng toàn quốc, 2-5 ngày làm việc
- Miễn phí ship đơn từ 300.000đ
- Đổi trả 7 ngày nếu lỗi nhà sản xuất
- Thanh toán: COD và VNPay
- Nhận đặt làm riêng, khắc tên theo yêu cầu

QUY TẮC TRẢ LỜI:
- Luôn dùng tiếng Việt, thân thiện và ngắn gọn (tối đa 3-4 câu)
- Dùng emoji phù hợp 🎁 💝 ✨
- Nếu không biết, hướng khách liên hệ hotline 0909-xxx-xxx
- KHÔNG bịa thông tin giá, tồn kho cụ thể
"""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
```

Sau đó build model:

```bash
ollama create handmade-bot -f Modelfile

# Test thử
ollama run handmade-bot "Shop có túi da không?"
```

### Bước 4 — Cập nhật AiChatService.java để dùng Ollama

Thêm dependency vào `pom.xml`:

```xml
<!-- Không cần thêm gì, dùng RestTemplate sẵn có -->
```

Tạo file mới `OllamaService.java`:

```java
// backend/src/main/java/com/handmade/handmade_api/modules/chatbox/service/OllamaService.java
package com.handmade.handmade_api.modules.chatbox.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OllamaService {

    private static final Logger logger = LoggerFactory.getLogger(OllamaService.class);

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:handmade-bot}")
    private String ollamaModel;

    @Value("${ollama.enabled:false}")
    private boolean ollamaEnabled;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isEnabled() {
        return ollamaEnabled;
    }

    @SuppressWarnings("unchecked")
    public String chat(String userMessage, String systemContext) {
        try {
            String url = ollamaBaseUrl + "/api/chat";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("model", ollamaModel);
            body.put("stream", false);

            List<Map<String, String>> messages = new ArrayList<>();
            if (systemContext != null && !systemContext.isEmpty()) {
                messages.add(Map.of("role", "system", "content", systemContext));
            }
            messages.add(Map.of("role", "user", "content", userMessage));
            body.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);

            if (response != null && response.containsKey("message")) {
                Map<String, Object> msg = (Map<String, Object>) response.get("message");
                return (String) msg.get("content");
            }
            return null;
        } catch (Exception e) {
            logger.warn("Ollama không khả dụng: {}", e.getMessage());
            return null;
        }
    }
}
```

Sửa `AiChatService.java` — thêm Ollama vào pipeline:

```java
// Trong method generateResponse(), thêm trước block Groq:
@Autowired
private OllamaService ollamaService;

public String generateResponse(String userMsg, String context) {
    // 1. Thử Ollama local trước (nếu được bật)
    if (ollamaService.isEnabled()) {
        String ollamaReply = ollamaService.chat(userMsg, context);
        if (ollamaReply != null && !ollamaReply.isEmpty()) {
            return ollamaReply;
        }
    }

    // 2. Thử Groq cloud (nếu có API key)
    String apiKey = configService.getConfig("GROQ_API_KEY", "");
    if (!apiKey.isEmpty()) {
        // ... code Groq hiện tại giữ nguyên
    }

    // 3. Fallback FAQ keyword
    return getFallbackResponse(userMsg);
}
```

Thêm config vào `application.properties`:

```properties
# ===== OLLAMA LOCAL AI =====
ollama.enabled=true
ollama.base-url=http://localhost:11434
ollama.model=handmade-bot
```

---

---

## CÁCH C — Groq Free Tier (khuyến nghị nhất)

Groq cung cấp API **miễn phí** với rate limit cao. Đây là cách dễ nhất, không cần GPU.

### Bước 1 — Lấy API key miễn phí

1. Truy cập [https://console.groq.com](https://console.groq.com)
2. Đăng ký bằng Google / GitHub
3. Vào **API Keys** → **Create API Key**
4. Copy key dạng `gsk_xxxxxxxxxxxxxxxxxxxx`

**Free tier:** 30 request/phút, 6000 token/phút, 500,000 token/ngày — đủ để phát triển.

### Bước 2 — Cấu hình key

**Option 1 — application.properties (nhanh nhất khi dev):**

```properties
groq.api.key=gsk_xxxxxxxxxxxxxxxxxxxx
groq.model=llama-3.1-8b-instant
```

**Option 2 — Environment variable (an toàn hơn):**

```bash
# Windows CMD
set GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Windows PowerShell
$env:GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxx"
```

Trong `application.properties`, giữ nguyên:
```properties
groq.api.key=${GROQ_API_KEY:}
```

**Option 3 — Cập nhật qua Admin UI:**

Vào `/admin/promotions` (tab Chatbox) → Nhập API key → Lưu.  
Key được lưu vào bảng `ai_configurations` và không cần restart server.

### Bước 3 — Tùy chỉnh System Prompt

Vào Admin UI hoặc chạy SQL:

```sql
UPDATE ai_configurations
SET config_value = '
Bạn là trợ lý ảo của HandMade Shop, chuyên bán đồ thủ công mỹ nghệ handmade tại Việt Nam.

THÔNG TIN SHOP:
- Sản phẩm: túi ví, trang sức, gốm sứ, đồ da, phụ kiện thời trang, đồ decor nhà
- Giá từ 89.000đ - 1.500.000đ tùy sản phẩm
- Giao hàng toàn quốc, 2-5 ngày, miễn ship đơn ≥ 300.000đ
- Đổi trả 7 ngày nếu lỗi nhà sản xuất
- Thanh toán: COD và VNPay
- Nhận đặt làm riêng, khắc tên theo yêu cầu

CÁCH TRẢ LỜI:
- Tiếng Việt, thân thiện, ngắn gọn (3-4 câu)
- Dùng emoji phù hợp 🎁 💝 ✨ 🛍️
- Khi hỏi về sản phẩm cụ thể: hướng dẫn vào trang Sản phẩm
- Khi hỏi giá: nói rõ khoảng giá, tránh cam kết giá cụ thể
- Khi không biết: đề nghị liên hệ hotline
- KHÔNG bịa thông tin tồn kho, trạng thái đơn hàng
'
WHERE config_key = 'SYSTEM_PROMPT';
```

### Bước 4 — Chọn mô hình phù hợp

| Model | Tốc độ | Chất lượng | Dùng khi |
|-------|--------|-----------|---------|
| `llama-3.1-8b-instant` | Rất nhanh | Tốt | Dev / Production |
| `llama-3.3-70b-versatile` | Chậm hơn | Rất tốt | Demo / Showcase |
| `gemma2-9b-it` | Nhanh | Tốt tiếng Việt | Thay thế |
| `mixtral-8x7b-32768` | Trung bình | Rất tốt | Context dài |

Cập nhật model:

```sql
UPDATE ai_configurations
SET config_value = 'llama-3.1-8b-instant'
WHERE config_key = 'AI_MODEL';
```

---

## Fine-tuning bằng RAG (Retrieval-Augmented Generation)

Thay vì train lại model, dùng RAG để "dạy" chatbot biết về sản phẩm shop mà không cần GPU.

### Cách hoạt động

```
Câu hỏi user: "Có túi da màu nâu không?"
        │
        ▼
Tìm kiếm vector trong DB sản phẩm
        │
        ▼
Lấy 3-5 sản phẩm liên quan nhất
        │
        ▼
Ghép vào prompt: "Dựa trên sản phẩm sau: [...]  Trả lời: ..."
        │
        ▼
Groq / Ollama trả lời có ngữ cảnh cụ thể
```

### Bước 1 — Cài pgvector (PostgreSQL extension)

```sql
-- Cài extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Thêm cột vector vào products
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(384);
```

### Bước 2 — Tạo script Python tạo embedding

```python
# scripts/generate_embeddings.py
"""
Tạo vector embedding cho tất cả sản phẩm.
Cài: pip install psycopg2-binary sentence-transformers
"""
import psycopg2
from sentence_transformers import SentenceTransformer

DB_CONFIG = {
    "host": "localhost", "port": 5432,
    "dbname": "ecommerce_handmade_dev",
    "user": "postgres", "password": "123456",
}

# Model nhỏ, chạy CPU, hỗ trợ tiếng Việt tốt
model = SentenceTransformer('keepitreal/vietnamese-sbert')

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

cur.execute("SELECT id, name, description FROM products WHERE embedding IS NULL")
products = cur.fetchall()

print(f"Tạo embedding cho {len(products)} sản phẩm...")

for pid, name, desc in products:
    text = f"{name}. {desc or ''}"
    embedding = model.encode(text).tolist()
    cur.execute(
        "UPDATE products SET embedding = %s WHERE id = %s",
        (embedding, pid)
    )
    print(f"  ✅ [{pid}] {name[:40]}")

conn.commit()
cur.close()
conn.close()
print("Hoàn tất!")
```

```bash
pip install sentence-transformers psycopg2-binary
python scripts/generate_embeddings.py
```

### Bước 3 — Thêm RAG vào AiChatService.java

Thêm method tìm sản phẩm liên quan:

```java
// Thêm vào AiChatService.java

public String buildProductContext(String userMsg) {
    try {
        // Tìm sản phẩm liên quan qua keyword (đơn giản)
        // Hoặc dùng pgvector nếu đã cài
        List<String> keywords = extractKeywords(userMsg);
        if (keywords.isEmpty()) return "";

        // Query sản phẩm liên quan
        String sql = """
            SELECT name, price, description, category_id
            FROM products
            WHERE LOWER(name) LIKE ANY(ARRAY[?])
               OR LOWER(description) LIKE ANY(ARRAY[?])
            LIMIT 3
        """;
        // Thực thi query và format kết quả
        // (implement theo JPA hoặc JdbcTemplate)

        return formatProductContext(/* kết quả */);
    } catch (Exception e) {
        return "";
    }
}

private String formatProductContext(List<Object[]> products) {
    if (products.isEmpty()) return "";
    StringBuilder sb = new StringBuilder("Sản phẩm liên quan:\n");
    for (Object[] p : products) {
        sb.append(String.format("- %s: %,.0f₫ — %s\n",
            p[0], ((Number)p[1]).doubleValue(),
            p[2] != null ? ((String)p[2]).substring(0, Math.min(60, ((String)p[2]).length())) : ""));
    }
    return sb.toString();
}
```

Cập nhật `generateResponse()` để dùng RAG:

```java
public String generateResponse(String userMsg, String context) {
    // Thêm ngữ cảnh sản phẩm vào context
    String productContext = buildProductContext(userMsg);
    String fullContext = context + "\n" + productContext;

    // ... rest of method
}
```

---

## Cấu hình Admin Chatbox UI

Tất cả cấu hình có thể thay đổi real-time qua `/admin/promotions`:

| Config Key | Giá trị mẫu | Mô tả |
|-----------|------------|-------|
| `GROQ_API_KEY` | `gsk_xxx` | API key Groq |
| `AI_MODEL` | `llama-3.1-8b-instant` | Model dùng |
| `SYSTEM_PROMPT` | Xem ví dụ trên | Persona và hành vi |
| `TEMPERATURE` | `0.7` | Sáng tạo (0=chính xác, 1=ngẫu nhiên) |
| `GROQ_API_URL` | `https://api.groq.com/...` | Endpoint API |
| `SHOP_ADDRESS` | `TP.HCM` | Địa chỉ hiển thị |
| `SHOP_POLICY` | `Đổi trả 7 ngày...` | Chính sách |
| `FEATURED_PRODUCTS_CONTEXT` | `Túi tote 89k...` | Sản phẩm nổi bật |

---

## Tóm tắt — Khuyến nghị theo từng trường hợp

```
Đang dev, không có net  →  Cách A (FAQ offline)
Máy RAM 8GB+            →  Cách B (Ollama, 100% offline)
Muốn nhanh + chất lượng →  Cách C (Groq free tier) ⭐ KHUYẾN NGHỊ
Muốn chatbot biết SP    →  Cách C + RAG embedding
```

### Thứ tự ưu tiên trong code (đã thiết kế sẵn)

```
1. Ollama local (nếu ollama.enabled=true và server đang chạy)
2. Groq API (nếu GROQ_API_KEY có giá trị)
3. FAQ keyword fallback (luôn có, không cần cấu hình)
```

Mỗi bước fail sẽ tự động fallback xuống bước tiếp theo — hệ thống không bao giờ trả về lỗi trống với người dùng.
