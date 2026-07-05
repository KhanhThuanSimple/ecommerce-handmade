const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, 'src', 'mock-data', 'products');
const API_URL = 'http://localhost:8080/api/admin/products';

async function importData() {
    try {
        const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'));
        console.log(`Found ${files.length} JSON files in ${PRODUCTS_DIR}`);

        // Try to login first to get the token
        let token = '';
        try {
            const loginRes = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: "phu@gmail.com", password: "123456" })
            });
            if (loginRes.ok) {
                const data = await loginRes.json();
                token = data.token;
                console.log("✅ Logged in successfully. Token acquired.");
            } else {
                console.error("❌ Login failed. Trying thuan11111@gmail.com...");
                const loginRes2 = await fetch('http://localhost:8080/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: "thuan11111@gmail.com", password: "123456" })
                });
                if (loginRes2.ok) {
                    const data = await loginRes2.json();
                    token = data.token;
                    console.log("✅ Logged in successfully with Thuan. Token acquired.");
                } else {
                     console.error("❌ Both logins failed. Please check credentials or temporarily disable security.");
                     return;
                }
            }
        } catch (e) {
            console.error("Login request error:", e);
            return;
        }

        let totalImported = 0;
        let totalFailed = 0;

        for (const file of files) {
            const filePath = path.join(PRODUCTS_DIR, file);
            const rawData = fs.readFileSync(filePath, 'utf8');
            const products = JSON.parse(rawData);

            console.log(`\nImporting ${products.length} products from ${file}...`);

            for (const p of products) {
                const payload = {
                    name: p.name,
                    price: p.price || 0,
                    category: p.category || "Chưa phân loại",
                    categoryId: p.categoryId || 1,
                    description: p.description || p.name,
                    inventory: p.inventory || 100,
                    status: "active",
                    images: p.imageUrl ? [p.imageUrl] : []
                };

                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        totalImported++;
                        console.log(`✅ Success: ${p.name}`);
                    } else {
                        totalFailed++;
                        const errorText = await response.text();
                        console.error(`❌ Failed: ${p.name} - ${response.status} ${errorText}`);
                    }
                } catch (error) {
                    totalFailed++;
                    console.error(`❌ Error importing ${p.name}:`, error.message);
                }
                
                // Delay 50ms to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        console.log(`\n🎉 IMPORT SUMMARY 🎉`);
        console.log(`Total successfully imported: ${totalImported}`);
        console.log(`Total failed: ${totalFailed}`);

    } catch (err) {
        console.error("Error reading directory:", err);
    }
}

importData();
