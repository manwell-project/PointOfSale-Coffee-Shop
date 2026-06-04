# 📱 Panduan Fitur Barcode Scanning - DigiCaf POS

## 🎯 Ringkasan Fitur

Sistem barcode scanning memungkinkan kasir untuk menambahkan produk ke keranjang dengan cepat dan akurat melalui scan barcode, tanpa perlu mencari atau mengetik nama produk.

**Use Case:**
- Produk botol air Aqua dengan berbagai ukuran (200ml, 600ml, 1500ml)
- Setiap ukuran memiliki barcode unik sendiri
- Kasir scan barcode → produk otomatis masuk ke keranjang dengan stok yang benar

---

## 🔧 Setup Barcode

### Step 1: Input Barcode di Admin Panel (Kelola Menu)

1. Buka **Kelola Menu**
2. Klik **"Tambah Menu"** atau klik edit di produk yang sudah ada
3. Isi semua detail produk seperti biasa
4. **Isi field "Barcode"** dengan kode barcode produk
   - Contoh: `8992000005003` (Aqua Botol 600ml)
   - Format: string unik untuk setiap produk

5. Klik **Simpan**

![Barcode Input Form](./barcode-setup.png)

> ✅ **Tip:** Setiap barcode harus unik. Jika Anda punya multiple ukuran Aqua, gunakan barcode terpisah untuk masing-masing.

---

## 💳 Cara Menggunakan Barcode di POS

### Alur Transaksi

```
┌─────────────────────────────────────┐
│  1. Kasir membuka halaman Transaksi │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  2. Lihat "Barcode Scanner" di atas  │
│     Scan Barcode atau ketik code    │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  3. Tekan ENTER setelah scan        │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  4. Produk otomatis masuk keranjang │
│     Stok berkurang saat transaksi   │
└─────────────────────────────────────┘
```

### Step-by-Step Penggunaan

**Step 1: Buka Halaman Transaksi**
- Dari sidebar, klik **Transaksi**

**Step 2: Gunakan Barcode Scanner**
Di bagian atas halaman, ada area "Barcode Scanner" dengan:
- 📊 Icon barcode
- Input field untuk scan/ketik barcode
- Status feedback

**Step 3: Scan Barcode**
- Gunakan barcode scanner fisik (jika ada) → otomatis input ke field
- Atau **ketik manual** kode barcode

**Step 4: Tekan ENTER**
- Sistem akan:
  - ✅ Cari produk dengan barcode tersebut
  - ✅ Cek stok tersedia
  - ✅ Tambah ke keranjang qty 1
  - ✅ Tampilkan feedback "Produk ditambahkan"

**Step 5: Scan Produk Lain (jika ada)**
- Input barcode berikutnya → field otomatis clear & ready scan lagi
- Ulangi untuk semua produk

**Step 6: Bayar**
- Setelah scan semua produk, klik **Bayar** untuk proses transaksi
- Stok otomatis berkurang saat pembayaran sukses

---

## 📊 Contoh Skenario: Aqua Multi-Ukuran

Kamu punya 3 produk Aqua berbeda ukuran:

| Produk | Barcode | Harga | Stok |
|--------|---------|-------|------|
| Aqua 200ml | 8992000005010 | Rp 3.000 | 100 |
| Aqua 600ml | 8992000005003 | Rp 5.000 | 50 |
| Aqua 1500ml | 8992000005027 | Rp 8.000 | 25 |

### Skenario Transaksi:
```
1. Kasir scan: 8992000005010 → Aqua 200ml +1 ke keranjang
2. Kasir scan: 8992000005010 → Aqua 200ml +1 ke keranjang (total qty=2)
3. Kasir scan: 8992000005003 → Aqua 600ml +1 ke keranjang
4. Kasir scan: 8992000005027 → Aqua 1500ml +1 ke keranjang

Keranjang:
- Aqua 200ml x2 @ Rp 3.000 = Rp 6.000
- Aqua 600ml x1 @ Rp 5.000 = Rp 5.000
- Aqua 1500ml x1 @ Rp 8.000 = Rp 8.000
TOTAL = Rp 19.000

5. Klik Bayar → Pembayaran diproses
6. Stok otomatis berkurang:
   - Aqua 200ml: 100 - 2 = 98
   - Aqua 600ml: 50 - 1 = 49
   - Aqua 1500ml: 25 - 1 = 24
```

---

## 🔍 API Documentation

### Endpoint: GET /api/products/barcode/:barcode

**Deskripsi:** Cari produk berdasarkan barcode

**Request:**
```bash
GET /api/products/barcode/8992000005003
```

**Response Success (200):**
```json
{
  "id": 16,
  "name": "Aqua Botol 600ml",
  "category": "Minuman",
  "price": 5000,
  "description": "Air minum dalam kemasan",
  "barcode": "8992000005003",
  "quantity": 50,
  "is_available": 1,
  ...
}
```

**Response Error (404):**
```json
{
  "error": "Product not found",
  "barcode": "9999999999999"
}
```

---

## ⚙️ Update Produk Dengan Barcode

### Via API (PUT)
```bash
curl -X PUT http://localhost:3000/api/products/16 \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "8992000005003"
  }'
```

### Via UI (Kelola Menu)
1. Klik edit produk
2. Update field Barcode
3. Klik Simpan

---

## 🎮 Troubleshooting

### ❌ "Barcode tidak ditemukan"
- Cek barcode sudah diinput dengan benar di Kelola Menu
- Pastikan barcode match persis (case-sensitive)
- Periksa spelling & angka

### ❌ "Stok habis"
- Produk stok = 0
- Perlu restock di menu Manajemen Stok
- Update stok → baru bisa scan

### ❌ Input barcode tidak terdeteksi
- Pastikan barcode input field fokus (kursor ada di field)
- Coba klik di area input dulu sebelum scan
- Check barcode scanner setting (jika fisik)

### ❌ Produk masuk tapi tidak muncul di keranjang
- Refresh halaman
- Check browser console untuk error
- Hubungi admin jika masih bermasalah

---

## 💡 Tips & Best Practices

✅ **DO:**
- Gunakan barcode resmi dari kemasan produk
- Pastikan input barcode sebelum stok diperlukan
- Scan barcode dengan fokus di input field
- Update stok setelah stock opname

❌ **DON'T:**
- Jangan ubah barcode produk yang sudah sering digunakan
- Jangan gunakan barcode yang sama untuk produk berbeda
- Jangan scan terlalu cepat berturut-turut tanpa waiting status

---

## 📈 Future Features

Rencana pengembangan:
- [ ] Barcode generator untuk produk custom
- [ ] Import barcode dari file Excel
- [ ] Print barcode label
- [ ] Barcode batch scanning (multiple items at once)
- [ ] Barcode history tracking
- [ ] QR code support

---

**Questions?** Hubungi admin atau cek documentation di server!
