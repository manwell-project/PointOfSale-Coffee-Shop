# DigiCaf - Coffee Shop POS System

## 📦 Project Structure

```
PointOfSale-Coffee-Shop/
├── server/                 # Backend (Node.js + Express + SQLite)
│   ├── db/
│   │   ├── schema.sql      # Database schema
│   │   ├── init.js         # Database initialization & seeding
│   │   └── connection.js   # Database connection helpers
│   ├── routes/             # API endpoints
│   │   ├── products.js     # Products CRUD
│   │   ├── stocks.js       # Stock management
│   │   ├── employees.js    # Employee management
│   │   ├── customers.js    # Customer management
│   │   ├── transactions.js # Transaction handling
│   │   └── reports.js      # Reports & analytics
│   ├── middleware/
│   │   └── errorHandler.js # Error handling middleware
│   └── index.js            # Main server file
├── Dashboard/              # Dashboard page
├── Transaksi/              # POS transaction page
├── Manajemen_Karyawan/     # Employee management page
├── Manajemen_Pelanggan/    # Customer management page
├── Manejemen_stok/         # Stock management page
├── Laporan POS/            # Reports page
├── css/                    # Shared styles
├── js/                     # Shared JavaScript (navbar, layout)
├── index.html              # Main entry point
├── package.json            # Dependencies
├── .env                    # Environment variables
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd "PointOfSale-Coffee-Shop"
npm install
```

### 2. Start Backend Server
```bash
npm run dev
```

The server will:
- Create SQLite database at `server/db/digicaf.db`
- Initialize all tables
- Seed sample data (products, employees)
- Start API server at `http://localhost:3000`

### 3. Access Frontend
Open browser: `http://localhost:3000`

## 📚 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Stocks
- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/low-stock/list` - Get low stock items
- `GET /api/stocks/:id` - Get single stock
- `PUT /api/stocks/:id` - Update stock quantity
- `GET /api/stocks/product/:product_id/history` - Get stock history

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `GET /api/employees/shift/:shift` - Get employees by shift
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `GET /api/customers/phone/:phone` - Get customer by phone
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction details with items
- `GET /api/transactions/date/:date` - Get transactions by date
- `GET /api/transactions/summary/daily` - Get daily sales summary

### Reports
- `GET /api/reports/daily` - Daily sales report
- `GET /api/reports/monthly?year=2024&month=01` - Monthly sales report
- `GET /api/reports/products/bestsellers` - Best selling products
- `GET /api/reports/employees/sales` - Employee sales performance
- `GET /api/reports/stocks/summary` - Stock summary with low items

## 🗄️ Database Schema

### Tables
1. **products** - Menu items
2. **stocks** - Product inventory
3. **employees** - Staff information
4. **customers** - Customer information
5. **transactions** - Sales transactions
6. **transaction_items** - Line items in transactions
7. **stock_history** - Audit trail for stock changes

## 🔧 Environment Variables (.env)

```
PORT=3000
NODE_ENV=development
API_BASE=http://localhost:3000/api
```

## 💡 Usage Examples

### Create a Transaction
```javascript
const response = await fetch('http://localhost:3000/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { product_id: 1, quantity: 2, unit_price: 20000, subtotal: 40000 },
      { product_id: 2, quantity: 1, unit_price: 25000, subtotal: 25000 }
    ],
    customer_id: 1,
    employee_id: 1,
    payment_method: 'cash',
    total_amount: 65000
  })
});
```

### Add New Employee
```javascript
const response = await fetch('http://localhost:3000/api/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Rina Sari',
    shift: 'Pagi',
    phone: '08123456789',
    email: 'rina@coffee.com'
  })
});
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Change PORT in .env or run:
npm run dev -- --port 3001
```

### Database issues
```bash
# Delete database and reinitialize:
rm server/db/digicaf.db
npm run dev
```

### CORS errors
Make sure API_BASE in frontend matches your server URL

## 📝 Next Steps

1. ✅ Integrate frontend with API endpoints
2. ✅ Add user authentication
3. ✅ Add data validation
4. ✅ Add logging system
5. ✅ Setup automated backups
6. ✅ Deploy to production server

## 📞 Support

For issues or questions, check the logs or contact the development team.

---

**Created:** January 2024
**Version:** 1.0.0
**License:** ISC
