# Templates

Folder ini berisi **main halaman (base layout)** supaya semua page seragam.

## 1) Halaman biasa (tanpa Framework7)
- Base layout (manual): `templates/page.html`
- Content-only (recommended): `templates/content-only.html`

## 2) Halaman Framework7
- Base layout (manual): `templates/page-framework7.html`
- Content-only (recommended): `templates/content-only-framework7.html`

## Konsep "extend" (untuk HTML statis)
Karena ini proyek HTML statis (tanpa template engine), "extend" paling aman dibuat dengan cara:
- Halaman hanya menulis **main content**
- Header + wrapper layout di-inject oleh `js/layout.js`

Aktifkan dengan menambahkan atribut `data-digicaf-layout="auto"` pada root container.

## ASSET PREFIX (penting)
Karena setiap halaman berada di folder berbeda, path asset harus disesuaikan.

- Kalau file kamu ada di `/NamaFolder/index.html`, umumnya pakai prefix `../`
  - contoh: `../css/shared-ui.css`, `../js/navbar.js`
- Kalau file kamu ada di root project, pakai prefix `./`
  - contoh: `./css/shared-ui.css`, `./js/navbar.js`

Disarankan preview pakai server (misalnya `http-server`) supaya path konsisten.
