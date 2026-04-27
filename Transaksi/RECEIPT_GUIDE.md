# 📋 Panduan Fitur Cetak Struk (Receipt Printing)

## Deskripsi Fitur

Fitur cetak struk memungkinkan Anda untuk:
- ✅ Menampilkan struk pembayaran dalam format profesional
- ✅ Mencetak struk ke printer fisik atau menyimpan sebagai PDF
- ✅ Membagikan struk melalui WhatsApp
- ✅ Menampilkan informasi transaksi yang lengkap dan rapi

## Komponen Fitur

### 1. **Receipt Manager** (`Transaksi/js/receipt.js`)
Modul JavaScript yang mengelola semua fungsi struk:

```javascript
// Menampilkan struk
receiptManager.showReceipt(transactionData);

// Mencetak struk
receiptManager.printReceipt();

// Menutup struk
receiptManager.closeReceipt();

// Berbagi via WhatsApp
receiptManager.shareViaWhatsApp();
```

### 2. **Receipt Styling** (`Transaksi/css/receipt.css`)
CSS khusus untuk:
- Modal struk yang responsif
- Layout struk yang rapi (80mm untuk printer termal)
- Print-friendly styling
- Dark mode support
- Mobile optimization

### 3. **HTML Integration**
- File: `Transaksi/index.html`
- CSS link: `./css/receipt.css`
- JS script: `./js/receipt.js`

## Struktur Data Transaksi

```javascript
{
  transactionId: "12345",           // ID transaksi dari backend
  items: [
    {
      id: 1,
      name: "Espresso",
      price: 25000,
      quantity: 2,
      subtotal: 50000
    },
    // ... item lainnya
  ],
  subtotal: 50000,                   // Total sebelum pajak
  tax: 5000,                         // Pajak (PPN 10%)
  discount: 0,                       // Diskon
  total: 55000,                      // Total akhir
  paymentMethod: "cash",             // Metode pembayaran
  paymentAmount: 60000,              // Jumlah uang dari customer
  changeAmount: 5000,                // Kembalian
  customerName: "Budi Santoso",      // Nama customer (opsional)
  customerPhone: "08123456789",      // Telepon customer (opsional)
  timestamp: "2026-04-16T10:30:00",  // Waktu transaksi
  cashier: "Admin"                   // Nama kasir
}
```

## Cara Penggunaan

### 1. **Menampilkan Struk Setelah Pembayaran**
Saat proses pembayaran selesai di `processPayment()`:

```javascript
// Data transaksi dari API
const transactionData = {
  transactionId: response.id,
  items: cartItems,
  total: cartTotal,
  paymentMethod: selectedPaymentMethod,
  paymentAmount: paymentAmount,
  changeAmount: changeAmount,
  timestamp: new Date().toISOString()
};

// Tampilkan struk
receiptManager.showReceipt(transactionData);
```

### 2. **Mencetak Struk**
Tombol "Cetak" di modal struk akan:
1. Membuka jendela print browser
2. Menampilkan struk dalam format 80mm (standar thermal printer)
3. Meminta konfirmasi pencetakan ke user

### 3. **Menutup Struk**
Tombol "Tutup" atau tekan `Esc` untuk menutup modal struk.

### 4. **Berbagi via WhatsApp**
```javascript
receiptManager.shareViaWhatsApp();
```
Ini akan membuka WhatsApp dengan pesan otomatis berisi detail transaksi.

## Kustomisasi

### Mengubah Nama dan Info Toko

Edit di `Transaksi/js/receipt.js`:

```javascript
let receiptManager = new ReceiptManager({
  shopName: 'Nama Toko Anda',
  shopSubtitle: 'Tagline Toko',
  shopAddress: 'Alamat Toko',
  shopPhone: 'Nomor Telepon'
});
```

### Format Struk

Anda dapat mengubah template HTML di dalam fungsi `generateReceiptHTML()` untuk:
- Menambah logo
- Mengubah format informasi
- Menambah QR code transaksi
- Menambah keterangan khusus

## Integrasi dengan API

Sistem sudah terintegrasi dengan API transactions:

```javascript
API.Transactions.create({
  items: cartItems,
  customer_id: null,
  employee_id: null,
  payment_method: selectedPaymentMethod,
  total_amount: cartTotal
})
```

Response dari API akan berisi `id` yang digunakan sebagai `transactionId` di struk.

## Fitur Tambahan (Belum Diimplementasi)

### 1. **Email Receipt**
```javascript
receiptManager.sendReceiptEmail('customer@example.com');
```
Memerlukan backend endpoint untuk mengirim email.

### 2. **Download PDF**
```javascript
receiptManager.downloadReceiptPDF();
```
Memerlukan library jsPDF atau similar.

### 3. **SMS Notification**
Bisa ditambahkan untuk mengirim SMS notifikasi ke customer.

## Troubleshooting

### Struk tidak muncul?
1. Pastikan `receipt.js` sudah dimuat: cek Console (F12)
2. Pastikan `transactionData` memiliki semua field yang diperlukan
3. Cek apakah `receiptManager` sudah diinisialisasi

### Print tidak berfungsi?
1. Pastikan printer sudah terhubung dan siap
2. Coba simpan ke PDF dulu: Print → Save as PDF
3. Cek CSS print styles di `receipt.css`

### Data tidak muncul di struk?
1. Pastikan data transaksi dikirim dengan format yang benar
2. Cek Console untuk error messages
3. Verifikasi struktur object `items` sesuai dengan contoh di atas

## Browser Compatibility

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## File yang Dimodifikasi

1. `Transaksi/index.html` - Menambah CSS dan script receipt
2. `Transaksi/css/receipt.css` - CSS baru untuk receipt
3. `Transaksi/js/receipt.js` - JavaScript module receipt (baru)

## Contoh Implementasi Lengkap

Untuk menguji fitur, Anda bisa membuat transaksi dengan data mock:

```javascript
// Mock transaction untuk testing
const mockTransaction = {
  transactionId: 123,
  items: [
    { id: 1, name: 'Espresso', price: 25000, quantity: 2, subtotal: 50000 },
    { id: 2, name: 'Cappuccino', price: 30000, quantity: 1, subtotal: 30000 }
  ],
  subtotal: 80000,
  tax: 8000,
  discount: 0,
  total: 88000,
  paymentMethod: 'cash',
  paymentAmount: 100000,
  changeAmount: 12000,
  customerName: 'John Doe',
  customerPhone: '08123456789',
  timestamp: new Date(),
  cashier: 'Admin'
};

// Tampilkan struk
receiptManager.showReceipt(mockTransaction);
```

## Support

Untuk pertanyaan atau masalah, silakan hubungi tim development.
