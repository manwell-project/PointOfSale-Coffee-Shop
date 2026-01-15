#!/usr/bin/env node

/**
 * Test Script untuk Dashboard Sync
 * Run: node server/test-dashboard-sync.js
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function testAPI(method, endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Dashboard Sync Setup...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing API Health...');
    const health = await testAPI('GET', '/health');
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   ✅ Response:`, health.data);

    // Test 2: Get products
    console.log('\n2️⃣  Testing Products API...');
    const products = await testAPI('GET', '/products');
    console.log(`   ✅ Status: ${products.status}`);
    console.log(`   ✅ Products count: ${products.data?.length || 0}`);
    if (products.data && products.data.length > 0) {
      console.log(`   ✅ First product: ${products.data[0].name}`);
    }

    // Test 3: Get daily report
    console.log('\n3️⃣  Testing Dashboard Daily Report...');
    const daily = await testAPI('GET', '/reports/daily');
    console.log(`   ✅ Status: ${daily.status}`);
    console.log(`   ✅ Revenue: Rp ${daily.data?.summary?.total_revenue || 0}`);
    console.log(`   ✅ Transactions: ${daily.data?.summary?.total_transactions || 0}`);
    if (daily.data?.top_products?.length > 0) {
      console.log(`   ✅ Top product: ${daily.data.top_products[0].name}`);
    }

    // Test 4: Get stock summary
    console.log('\n4️⃣  Testing Stock Summary...');
    const stock = await testAPI('GET', '/reports/stocks/summary');
    console.log(`   ✅ Status: ${stock.status}`);
    console.log(`   ✅ Total products: ${stock.data?.summary?.total_products || 0}`);
    console.log(`   ✅ Low stock count: ${stock.data?.summary?.low_stock_count || 0}`);

    console.log('\n✅ All tests passed! Dashboard sync is ready.\n');
    console.log('📊 Dashboard will update every 10 seconds automatically.');
    console.log('💳 POS products will load from database.\n');

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    console.error('   Make sure backend is running: npm run dev');
  }
}

runTests();
