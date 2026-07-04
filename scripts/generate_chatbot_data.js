const fs = require('fs');
const path = require('path');

const MOCK_DATA_DIR = path.join(__dirname, '../frontend/src/mock-data');
const OUTPUT_FILE = path.join(MOCK_DATA_DIR, 'chatbot_dataset.jsonl');

const systemPrompt = "Bạn là trợ lý AI thông minh chuyên tư vấn của shop đồ handmade ConstructX.";

// Hàm helper tạo mẫu ChatML format (OpenAI chuẩn)
function createConversation(userMsg, assistantMsg) {
    return JSON.stringify({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg },
            { role: "assistant", content: assistantMsg }
        ]
    });
}

function generateDataset() {
    let datasetLines = [];
    console.log("Bắt đầu đọc dữ liệu mock...");

    // 1. Đọc FAQ
    try {
        const faqPath = path.join(MOCK_DATA_DIR, 'faq.json');
        if (fs.existsSync(faqPath)) {
            const faqData = JSON.parse(fs.readFileSync(faqPath, 'utf-8'));
            faqData.forEach(faq => {
                faq.keywords.forEach(kw => {
                    const question = `Shop có bán ${kw} không?`;
                    const answer = `${faq.responseText}`;
                    datasetLines.push(createConversation(question, answer));
                    
                    const question2 = `Mình đang tìm mua ${kw}, tư vấn cho mình với.`;
                    datasetLines.push(createConversation(question2, answer));
                });
            });
            console.log(`Đã xử lý FAQ: sinh được ${datasetLines.length} mẫu.`);
        }
    } catch (e) {
        console.error("Lỗi đọc faq.json", e);
    }

    // 2. Đọc Chính sách
    try {
        const policyPath = path.join(MOCK_DATA_DIR, 'policyData.json');
        if (fs.existsSync(policyPath)) {
            const policies = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
            let policyListText = policies.map(p => `- ${p.title}`).join('\n');
            const q1 = "Chính sách bảo hành và đổi trả của shop thế nào?";
            const a1 = `Chào bạn, shop ConstructX có các chính sách hỗ trợ khách hàng như sau:\n${policyListText}\nBạn cần tư vấn thêm chi tiết về chính sách nào không ạ?`;
            datasetLines.push(createConversation(q1, a1));
            
            const q2 = "Shop có miễn phí vận chuyển không?";
            const a2 = "Dạ, shop có hỗ trợ giao hàng toàn quốc và miễn phí vận chuyển cho các đơn hàng đạt điều kiện nhé!";
            datasetLines.push(createConversation(q2, a2));
        }
    } catch (e) {
        console.error("Lỗi đọc policyData.json", e);
    }

    // 3. Đọc Sản phẩm
    try {
        const productsDir = path.join(MOCK_DATA_DIR, 'products');
        if (fs.existsSync(productsDir)) {
            const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
            files.forEach(file => {
                const prods = JSON.parse(fs.readFileSync(path.join(productsDir, file), 'utf-8'));
                prods.forEach(p => {
                    const q1 = `Sản phẩm ${p.name} giá bao nhiêu?`;
                    const a1 = `Chào bạn, sản phẩm ${p.name} hiện đang có giá là ${p.price.toLocaleString('vi-VN')} VNĐ. ${p.description} Hiện shop đang còn ${p.inventory} sản phẩm trong kho ạ.`;
                    datasetLines.push(createConversation(q1, a1));

                    const q2 = `Tư vấn cho mình ${p.name} với.`;
                    const a2 = `Dạ, ${p.name} là một trong những sản phẩm nổi bật của thể loại ${p.category}. ${p.description}. Giá sản phẩm là ${p.price.toLocaleString('vi-VN')} VNĐ. Bạn có muốn đặt hàng không ạ?`;
                    datasetLines.push(createConversation(q2, a2));
                });
            });
        }
    } catch (e) {
        console.error("Lỗi đọc thư mục products", e);
    }

    // Ghi ra file JSONL
    fs.writeFileSync(OUTPUT_FILE, datasetLines.join('\n'), 'utf-8');
    console.log(`\nHoàn thành! Đã tạo file dataset.jsonl tại: ${OUTPUT_FILE}`);
    console.log(`Tổng cộng: ${datasetLines.length} mẫu hội thoại.`);
}

generateDataset();
