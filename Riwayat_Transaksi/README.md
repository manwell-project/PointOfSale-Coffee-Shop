# Riwayat Transaksi (Transaction History)

## Overview
Fitur **Riwayat Transaksi** adalah halaman yang menampilkan semua riwayat transaksi penjualan di DigiCaf. Fitur ini memungkinkan pengguna untuk melihat, mencari, memfilter, dan mengekspor data transaksi.

## Features

### 1. **Daftar Transaksi**
- Menampilkan semua transaksi dalam format tabel
- Informasi yang ditampilkan:
  - ID Transaksi
  - Tanggal & Waktu
  - Nama Customer
  - Nama Karyawan
  - Total Pembayaran
  - Metode Pembayaran
  - Status Transaksi

### 2. **Pencarian (Search)**
- Pencarian real-time berdasarkan:
  - ID Transaksi
  - Nama Customer
  - Nama Karyawan

### 3. **Filter Lanjutan**
- Rentang Tanggal (From Date - To Date)
- Metode Pembayaran:
  - Tunai (Cash)
  - Kartu (Card)
  - Transfer
  - E-Wallet
- Status Transaksi:
  - Selesai (Completed)
  - Menunggu (Pending)
  - Dibatalkan (Cancelled)

### 4. **Ringkasan Statistik**
- Total Transaksi: Jumlah total transaksi
- Total Pendapatan: Jumlah total pendapatan
- Rata-rata Transaksi: Rata-rata nilai transaksi
- Transaksi Selesai: Jumlah transaksi yang selesai

### 5. **Detail Transaksi**
- Modal popup yang menampilkan detail lengkap transaksi
- Daftar barang yang dibeli beserta harga dan kuantitas
- Total pembayaran

### 6. **Cetak & Export**
- **Print Receipt**: Cetak struk transaksi
- **Export CSV**: Ekspor data transaksi ke format CSV

### 7. **Paginasi**
- Navigasi halaman untuk data yang banyak
- Menampilkan halaman saat ini dan total halaman
- Tombol Previous dan Next untuk navigasi

## File Structure

```
Riwayat_Transaksi/
├── index.html                 # HTML page
├── css/
│   └── history-layout.css     # Styling dan responsive design
└── js/
    └── transaction-history.js # Business logic dan API calls
```

## Penggunaan

### Akses Halaman
Halaman dapat diakses melalui URL:
```
/Riwayat_Transaksi/index.html
```

### Integrasi dengan Navbar
Untuk menambahkan link ke halaman ini di navbar, tambahkan ke file yang mengelola navigasi:

```html
<a href="/Riwayat_Transaksi/index.html" class="nav-link">
  <i class="fas fa-history"></i>
  Riwayat Transaksi
</a>
```

### API Dependencies
Fitur ini bergantung pada endpoint API berikut:

#### 1. **GET /api/transactions**
Mengambil semua transaksi
```json
Response:
[
  {
    "id": 1,
    "customer_id": null,
    "employee_id": 1,
    "total_amount": 50000,
    "payment_method": "cash",
    "status": "completed",
    "created_at": "2024-01-15T10:30:00Z",
    "customer_name": "John Doe",
    "employee_name": "Ahmad"
  }
]
```

#### 2. **GET /api/transactions/:id**
Mengambil detail transaksi tertentu beserta item-itemnya
```json
Response:
{
  "id": 1,
  "customer_id": null,
  "employee_id": 1,
  "total_amount": 50000,
  "payment_method": "cash",
  "status": "completed",
  "created_at": "2024-01-15T10:30:00Z",
  "customer_name": "John Doe",
  "employee_name": "Ahmad",
  "items": [
    {
      "id": 1,
      "transaction_id": 1,
      "product_id": 5,
      "quantity": 2,
      "unit_price": 20000,
      "subtotal": 40000,
      "product_name": "Espresso",
      "category": "coffee"
    }
  ]
}
```

## Design System

Fitur ini menggunakan design system yang sama dengan aplikasi DigiCaf:

### Color Palette
- **Primary**: #6B4423 (Brown - Coffee Theme)
- **Secondary**: #D4A574 (Tan/Beige)
- **Accent**: #C17B5C (Reddish-Brown)
- **Success**: #28A745 (Green)
- **Warning**: #FFC107 (Yellow)
- **Danger**: #DC3545 (Red)
- **Info**: #17A2B8 (Cyan)

### Typography
- Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'
- Heading: Bold, 28px
- Subtitle: Regular, 14px
- Body: Regular, 14px

### Responsive Design
- Desktop: Full width dengan padding
- Tablet: Adjusted grid dan font sizes
- Mobile: Single column layout, optimized spacing

## Features Detail

### Search & Filter Logic
```javascript
// Search mencari di 3 field:
1. ID Transaksi
2. Nama Customer
3. Nama Karyawan

// Filter dapat dikombinasikan:
- Date range (From - To)
- Payment method
- Transaction status
```

### Pagination
- Default 10 items per page
- Dapat diubah di variabel `itemsPerPage` di javascript

### Export Format
Format CSV yang diekspor:
```
ID Transaksi,Tanggal,Customer,Karyawan,Total,Pembayaran,Status
```

## Styling Notes

### Custom CSS Classes
- `.status-badge`: Badge untuk status transaksi
- `.payment-badge`: Badge untuk metode pembayaran
- `.transaction-amount`: Amount yang ditampilkan dengan warna hijau
- `.summary-card`: Kartu ringkasan statistik

### Animation
- Filter panel: Slide down animation (0.3s)
- Loading spinner: Continuous rotation animation
- Hover effects: Smooth transitions (200ms)

## Browser Support
- Chrome (Latest)
- Firefox (Latest)
- Safari (Latest)
- Edge (Latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations
1. Data di-load sekali dari API
2. Filter dilakukan di client-side (lebih cepat)
3. Pagination untuk membatasi DOM elements
4. CSS animations menggunakan transform (GPU accelerated)

## Future Enhancements
- [ ] Advanced filtering dengan multiple select
- [ ] Chart/Dashboard untuk visualization
- [ ] Email receipt sending
- [ ] Print preview sebelum print
- [ ] Transaction refund functionality
- [ ] Customer loyalty points tracking

## Troubleshooting

### Transaksi tidak muncul
1. Pastikan backend server running (`npm run dev:backend`)
2. Check console untuk error messages
3. Verify API endpoint di `/api/transactions`

### Filter tidak bekerja
1. Pastikan format tanggal sesuai (YYYY-MM-DD)
2. Check console untuk error messages
3. Reload halaman untuk reset

### Export CSV kosong
1. Pastikan ada data transaksi
2. Filter terlebih dahulu untuk memilih data yang ingin di-export

## Development Notes

### Menambah Field Baru
1. Update HTML table header di index.html
2. Update renderTable() function di transaction-history.js
3. Update CSS untuk styling baru

### Mengubah Items Per Page
```javascript
// Dalam transaction-history.js
const itemsPerPage = 10; // Ubah nilai ini
```

### Customize Payment Methods
```javascript
// Dalam formatPaymentMethod() function
const methods = {
    'cash': 'Tunai',
    'card': 'Kartu',
    // Tambah method baru di sini
};
```

---

**Created**: January 2025  
**Last Updated**: January 2025  
**Status**: Production Ready ✅
