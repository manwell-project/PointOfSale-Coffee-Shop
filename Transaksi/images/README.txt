==========================================
PANDUAN MENAMBAHKAN GAMBAR PRODUK
==========================================

Folder ini digunakan untuk menyimpan gambar produk menu kopi.

CARA PENGGUNAAN:
================

1. Siapkan gambar produk Anda dengan format:
   - Format: JPG, PNG, atau WebP
   - Ukuran rekomendasi: 300x300 pixels (square)
   - Resolusi: 72-150 dpi
   - Ukuran file: < 200KB per gambar (untuk performa optimal)

2. Beri nama file sesuai dengan produk, contoh:
   - espresso.jpg
   - cappuccino.jpg
   - latte.jpg
   - americano.jpg
   - mocha.jpg
   - affogato.jpg

3. Edit file index.html di folder Transaksi
   Ubah bagian products data dari:
   
   { id: 1, name: 'Espresso', price: 20000, icon: 'coffee', image: null }
   
   Menjadi:
   
   { id: 1, name: 'Espresso', price: 20000, icon: 'coffee', image: './images/espresso.jpg' }

4. Refresh browser Anda dan gambar akan muncul!

TIPS:
=====

- Pastikan semua gambar memiliki rasio yang sama (square/kotak)
- Gunakan background yang konsisten
- Edit gambar agar terlihat profesional
- Compress gambar terlebih dahulu untuk loading cepat
- Jika gambar gagal dimuat, icon akan ditampilkan sebagai fallback

REKOMENDASI TOOLS:
==================

- Resize & Crop: https://www.iloveimg.com/resize-image
- Compress: https://tinypng.com/
- Remove Background: https://www.remove.bg/
- Edit Online: https://www.photopea.com/

==========================================
Dibuat untuk DigiCaf POS System
==========================================
