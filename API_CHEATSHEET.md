# DigiCaf API Cheat Sheet

## 🚀 Quick Reference

**API Base URL:** `http://localhost:3000/api`

---

## ⚡ Quick Commands (Copy-Paste)

### Load dalam Console Browser
```javascript
// Sudah auto-loaded jika ada di index.html
// Atau paste ini di console
fetch('http://localhost:3000/js/api-helper.js')
  .then(r => r.text())
  .then(code => eval(code));
```

---

## 📦 Products

| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/products` | Semua produk |
| GET | `/products/:id` | Detail produk |
| GET | `/products/category/:cat` | Produk per kategori |
| POST | `/products` | Tambah produk |
| PUT | `/products/:id` | Update produk |
| DELETE | `/products/:id` | Hapus produk |

**Example:**
```javascript
// Get semua
API.Products.getAll().then(p => console.table(p));

// Create
API.Products.create({
  name: 'Cappuccino Vanila',
  category: 'Coffee',
  price: 28000,
  description: 'Cappuccino dengan syrup vanila'
});

// Update harga
API.Products.update(1, { price: 22000 });
```

---

## 📊 Stocks

| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/stocks` | Semua stok |
| GET | `/stocks/:id` | Detail stok |
| GET | `/stocks/low-stock/list` | Items di bawah minimum |
| PUT | `/stocks/:id` | Update qty stok |

**Example:**
```javascript
// Low stock warning
API.Stocks.getLowStock().then(items => {
  items.forEach(item => 
    console.warn(`⚠️ ${item.name}: ${item.quantity} (min: ${item.min_stock})`)
  );
});

// Update stok
API.Stocks.update(1, {
  quantity: 100,
  change_reason: 'Restock',
  employee_id: 1
});

// History
API.Stocks.getHistory(1).then(h => console.table(h));
```

---

## 👥 Employees

| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/employees` | Semua karyawan |
| GET | `/employees/:id` | Detail karyawan |
| GET | `/employees/shift/:shift` | Filter by shift |
| POST | `/employees` | Tambah karyawan |
| PUT | `/employees/:id` | Update karyawan |
| DELETE | `/employees/:id` | Hapus karyawan |

**Example:**
```javascript
// Get semua
API.Employees.getAll().then(emp => console.table(emp));

// Karyawan shift pagi
API.Employees.getByShift('Pagi').then(emp => console.table(emp));

// Tambah
API.Employees.create({
  name: 'Rina Sari',
  shift: 'Siang',
  phone: '08123456789',
  email: 'rina@coffee.com'
});

// Hapus
API.Employees.delete(2);
```

---

## 👤 Customers

| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/customers` | Semua pelanggan |
| GET | `/customers/:id` | Detail pelanggan |
| GET | `/customers/phone/:phone` | Cari by phone |
| POST | `/customers` | Tambah pelanggan |
| PUT | `/customers/:id` | Update pelanggan |
| DELETE | `/customers/:id` | Hapus pelanggan |

**Example:**
```javascript
// Get semua
API.Customers.getAll().then(c => console.table(c));

// Cari by phone
API.Customers.getByPhone('08123456789').then(c => console.log(c));

// Create (bisa tanpa phone)
API.Customers.create({
  name: 'Budi Santoso',
  phone: '08567890123',
  address: 'Jl. Merdeka No. 123'
});
```

---

## 💳 Transactions

| Method | Endpoint | Usage |
|--------|----------|-------|
| POST | `/transactions` | Create transaksi |
| GET | `/transactions` | Semua transaksi |
| GET | `/transactions/:id` | Detail + items |
| GET | `/transactions/date/:date` | By date (YYYY-MM-DD) |

**Example:**
```javascript
// Create transaksi
const trx = await API.Transactions.create({
  items: [
    { product_id: 1, quantity: 2, unit_price: 20000, subtotal: 40000 },
    { product_id: 3, quantity: 1, unit_price: 25000, subtotal: 25000 }
  ],
  customer_id: 1,
  employee_id: 1,
  payment_method: 'cash',
  total_amount: 65000
});

console.log(`Transaksi #${trx.id} created`);

// Get by date
API.Transactions.getByDate('2024-01-08').then(t => console.table(t));

// Daily summary
API.Transactions.getDailySummary().then(s => console.table(s));
```

---

## 📈 Reports

| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/reports/daily` | Report harian |
| GET | `/reports/monthly` | Report bulanan |
| GET | `/reports/products/bestsellers` | Top products |
| GET | `/reports/employees/sales` | Sales/employee |
| GET | `/reports/stocks/summary` | Stock summary |

**Example:**
```javascript
// Daily report
API.Reports.getDaily().then(r => {
  console.log('Revenue:', formatRupiah(r.summary.total_revenue));
  console.log('Transactions:', r.summary.total_transactions);
  console.table(r.top_products);
});

// Best sellers
API.Reports.getBestsellers(5).then(b => console.table(b));

// Employee sales
API.Reports.getEmployeeSales().then(e => console.table(e));

// Stock warning
API.Reports.getStockSummary().then(s => {
  console.log(`Low stock items: ${s.summary.low_stock_count}`);
  console.table(s.low_stocks);
});

// Monthly (pakai query params)
API.Reports.getMonthly(2024, '01').then(r => console.table(r));
```

---

## 🎨 Utility Functions

```javascript
// Format currency
formatRupiah(50000)           // "Rp 50.000"
formatRupiah(1000000)         // "Rp 1.000.000"

// Format date
formatDate('2024-01-08')      // "8 Januari 2024"
formatDate('2024-01-08T10:30')// "8 Januari 2024 10:30"

// Show notification
showNotification('Berhasil!', 'success')   // green notification
showNotification('Error!', 'error')        // red notification
```

---

## 🔍 Debug Tips

```javascript
// Lihat semua API methods
console.log(window.API);

// Test koneksi
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(d => console.log(d));

// Monitor semua requests
window.addEventListener('fetch', e => console.log(e));
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "API not available" | Server tidak running | `npm run dev` |
| "CORS error" | Origin mismatch | Check API_BASE |
| "404 Not Found" | Endpoint salah | Check endpoint di API docs |
| "UNIQUE constraint" | Data duplicate | Gunakan UPDATE, bukan CREATE |
| "FOREIGN KEY constraint" | Invalid ID reference | Pastikan product_id valid |

---

**Need help?** Check `INTEGRATION_GUIDE.md` atau buka `http://localhost:3000` di browser.
