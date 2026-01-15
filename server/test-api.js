/**
 * API Testing Script for DigiCaf Backend
 * Run this in browser console or Node.js
 */

const API_BASE = 'http://localhost:3000/api';

// Helper function
async function testAPI(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`${method} ${endpoint}:`, result);
    return result;
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

// Test cases
async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  // 1. Test health check
  console.log('1️⃣ Health Check');
  await testAPI('GET', '/health');
  
  // 2. Get all products
  console.log('\n2️⃣ Get Products');
  const products = await testAPI('GET', '/products');
  
  // 3. Get all employees
  console.log('\n3️⃣ Get Employees');
  const employees = await testAPI('GET', '/employees');
  
  // 4. Get all stocks
  console.log('\n4️⃣ Get Stocks');
  const stocks = await testAPI('GET', '/stocks');
  
  // 5. Create new customer
  console.log('\n5️⃣ Create Customer');
  const customer = await testAPI('POST', '/customers', {
    name: 'Pelanggan Test',
    phone: '08123456789',
    email: 'test@example.com',
    address: 'Jl. Test No. 123'
  });
  
  // 6. Get low stock items
  console.log('\n6️⃣ Get Low Stock Items');
  await testAPI('GET', '/stocks/low-stock/list');
  
  // 7. Get daily report
  console.log('\n7️⃣ Get Daily Report');
  await testAPI('GET', '/reports/daily');
  
  // 8. Create transaction
  if (products && products.length > 0 && employees && employees.length > 0) {
    console.log('\n8️⃣ Create Transaction');
    const transaction = await testAPI('POST', '/transactions', {
      items: [
        { 
          product_id: products[0].id, 
          quantity: 2, 
          unit_price: products[0].price, 
          subtotal: products[0].price * 2 
        },
        { 
          product_id: products[1].id, 
          quantity: 1, 
          unit_price: products[1].price, 
          subtotal: products[1].price 
        }
      ],
      customer_id: customer?.id || null,
      employee_id: employees[0]?.id || null,
      payment_method: 'cash',
      total_amount: (products[0].price * 2) + products[1].price
    });
  }
  
  console.log('\n✅ API Tests Complete!');
}

// Run if in browser
if (typeof window !== 'undefined') {
  // Browser environment
  window.runTests = runTests;
  console.log('Run runTests() to start API testing');
} else {
  // Node.js environment
  runTests();
}
