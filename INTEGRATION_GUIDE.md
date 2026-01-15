# 🚀 Frontend - Backend Integration Guide

## ✅ Setup Selesai

Backend API Anda sudah berjalan di `http://localhost:3000` dengan:
- ✅ SQLite Database (auto-initialized)
- ✅ 6 modul API (Products, Stocks, Employees, Customers, Transactions, Reports)
- ✅ Sample data sudah di-seed (10 produk + 3 karyawan)
- ✅ Centralized API Helper

---

## 📝 Cara Menggunakan API Helper

### 1. **Include API Helper di HTML**
```html
<script src="../js/api-helper.js"></script>
```

### 2. **Gunakan dalam JavaScript**

#### Get All Products
```javascript
API.Products.getAll()
  .then(products => console.log(products))
  .catch(err => console.error(err));
```

#### Get Employees by Shift
```javascript
API.Employees.getByShift('Pagi')
  .then(employees => console.log(employees))
  .catch(err => console.error(err));
```

#### Create Transaction
```javascript
API.Transactions.create({
  items: [
    { product_id: 1, quantity: 2, unit_price: 20000, subtotal: 40000 }
  ],
  customer_id: 1,
  employee_id: 1,
  payment_method: 'cash',
  total_amount: 40000
})
.then(transaction => {
  console.log('Transaction created:', transaction.id);
})
.catch(err => console.error('Error:', err.message));
```

#### Get Daily Report
```javascript
API.Reports.getDaily()
  .then(report => {
    console.log('Total transactions:', report.summary.total_transactions);
    console.log('Total revenue:', formatRupiah(report.summary.total_revenue));
    console.log('Top products:', report.top_products);
  });
```

---

## 📚 Available API Objects

### **ProductsAPI**
- `getAll()` - Get all products
- `getById(id)` - Get single product
- `getByCategory(category)` - Filter by category
- `create(data)` - Create new product
- `update(id, data)` - Update product
- `delete(id)` - Delete product

### **StocksAPI**
- `getAll()` - Get all stocks
- `getById(id)` - Get single stock
- `getLowStock()` - Get items below minimum stock
- `update(id, data)` - Update stock quantity
- `getHistory(productId)` - Get stock change history

### **EmployeesAPI**
- `getAll()` - Get all employees
- `getById(id)` - Get single employee
- `getByShift(shift)` - Filter by shift
- `create(data)` - Add employee
- `update(id, data)` - Update employee
- `delete(id)` - Delete employee

### **CustomersAPI**
- `getAll()` - Get all customers
- `getById(id)` - Get single customer
- `getByPhone(phone)` - Search by phone
- `create(data)` - Add customer
- `update(id, data)` - Update customer
- `delete(id)` - Delete customer

### **TransactionsAPI**
- `getAll()` - Get all transactions
- `getById(id)` - Get transaction + items
- `create(data)` - Create new transaction
- `getByDate(date)` - Get transactions by date (YYYY-MM-DD)
- `getDailySummary()` - Get sales summary by date

### **ReportsAPI**
- `getDaily()` - Daily report with top products
- `getMonthly(year, month)` - Monthly report
- `getBestsellers(limit)` - Top selling products
- `getEmployeeSales()` - Employee sales performance
- `getStockSummary()` - Stock levels & low items

---

## 🎯 Integration Examples

### **Transaksi Page (POS)**
```javascript
// Load products
API.Products.getAll().then(products => {
  renderProductsList(products);
});

// Create transaction
const transaction = {
  items: keranjang.map(item => ({
    product_id: item.id,
    quantity: item.jumlah,
    unit_price: item.harga,
    subtotal: item.harga * item.jumlah
  })),
  employee_id: currentEmployeeId,
  total_amount: hitungTotal(),
  payment_method: 'cash'
};

API.Transactions.create(transaction)
  .then(result => {
    showNotification(`Transaksi #${result.id} berhasil!`);
    keranjang = [];
    renderKeranjang();
  });
```

### **Manajemen Karyawan**
```javascript
// Load employees
API.Employees.getAll().then(employees => {
  displayEmployeeList(employees);
});

// Add new employee
API.Employees.create({
  name: formData.name,
  shift: formData.shift,
  phone: formData.phone,
  email: formData.email
}).then(employee => {
  showNotification(`Karyawan ${employee.name} ditambahkan!`);
  API.Employees.getAll().then(employees => displayEmployeeList(employees));
});

// Update employee
API.Employees.update(employeeId, {
  name: newName,
  shift: newShift,
  phone: newPhone
}).then(() => showNotification('Karyawan diperbarui'));
```

### **Inventori Stok**
```javascript
// Get low stock items
API.Stocks.getLowStock().then(lowItems => {
  displayLowStockWarning(lowItems);
});

// Update stock
API.Stocks.update(stockId, {
  quantity: newQuantity,
  change_reason: 'Restock',
  employee_id: currentEmployeeId
}).then(() => {
  showNotification('Stok diperbarui');
  API.Stocks.getAll().then(stocks => displayStocks(stocks));
});
```

### **Dashboard**
```javascript
// Load all reports
async function loadDashboard() {
  const daily = await API.Reports.getDaily();
  const stockSummary = await API.Reports.getStockSummary();
  
  displayDailyStats(daily.summary);
  displayTopProducts(daily.top_products);
  displayLowStocks(stockSummary.low_stocks);
}
```

---

## 🔧 Utility Functions

### Format Mata Uang
```javascript
formatRupiah(50000) // Rp 50.000
```

### Format Tanggal
```javascript
formatDate('2024-01-08T10:30:00') // 8 Januari 2024 10:30
```

### Notification
```javascript
showNotification('Data berhasil disimpan', 'success');
showNotification('Terjadi kesalahan!', 'error');
```

---

## 📋 Next Steps

1. **Update Manajemen_Karyawan** - Integrasikan dengan API.Employees
2. **Update Manejemen_stok** - Integrasikan dengan API.Stocks
3. **Update Manajemen_Pelanggan** - Integrasikan dengan API.Customers
4. **Update Dashboard** - Load data dari API Reports
5. **Update Laporan POS** - Integrasikan dengan API.Reports
6. **Add Validation** - Server-side & client-side validation

---

## ❓ Troubleshooting

### "API not available" error
- Pastikan server berjalan: `npm run dev`
- Port 3000 tidak terblokir
- Check console untuk CORS errors

### "CORS error"
- Sudah di-handle di `server/index.js`
- Jika masih error, update origin di CORS config

### Data tidak tampil
- Check Network tab (F12) untuk request/response
- Pastikan database sudah initialized
- Lihat server console untuk error messages

---

**Status:** ✅ Ready for Integration
**Last Updated:** January 8, 2024
