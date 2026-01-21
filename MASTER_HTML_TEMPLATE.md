# Master HTML Template - DigiCaf POS

## Standard HTML Structure untuk Semua Halaman

### 1. HEAD Section - CSS Load Order (CRITICAL!)

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#8B4513">
    <title>[Page Title] - DigiCaf</title>
    
    <!-- Design System CSS -->
    <link rel="stylesheet" href="../css/design-tokens.css">
    <link rel="stylesheet" href="../css/typography.css">
    <link rel="stylesheet" href="../css/icons.css">
    <link rel="stylesheet" href="../css/layout-system.css">
    <link rel="stylesheet" href="../css/spacing-alignment.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/buttons.css">
    <link rel="stylesheet" href="../css/components/cards.css">
    <link rel="stylesheet" href="../css/components/forms.css">
    <link rel="stylesheet" href="../css/components/badges-labels.css">
    <link rel="stylesheet" href="../css/components/top-navbar-simple.css">
    <link rel="stylesheet" href="../css/components/sidebar-nav.css">
    
    <!-- UX Enhancement CSS (optional, jika diperlukan) -->
    <link rel="stylesheet" href="../css/components/loading-states.css">
    <link rel="stylesheet" href="../css/components/empty-states.css">
    <link rel="stylesheet" href="../css/components/toast-notifications.css">
    <link rel="stylesheet" href="../css/components/micro-interactions.css">
    
    <!-- Responsive Design CSS -->
    <link rel="stylesheet" href="../css/responsive.css">
    <link rel="stylesheet" href="../css/mobile-optimizations.css">
    <link rel="stylesheet" href="../css/tablet.css">
    
    <!-- Page Specific CSS - Load BEFORE page-adjustments.css -->
    <link rel="stylesheet" href="css/[page-name]-layout.css">
    <link rel="stylesheet" href="../css/shared-ui.css">
    
    <!-- Page Adjustments - MUST BE LAST! -->
    <link rel="stylesheet" href="../css/components/page-adjustments.css">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
```

### 2. BODY Section

```html
<body>
    <!-- Top Navigation Bar will be injected by top-navbar.js -->
    
    <!-- Page Wrapper -->
    <div class="[page-name]-wrapper">
        <div class="[page-name]-container">
            <!-- Page Content Here -->
        </div>
    </div>
    
    <!-- Scripts at bottom -->
</body>
```

### 3. SCRIPTS Section - Load Order (CRITICAL!)

```html
    <!-- Performance Scripts (defer) -->
    <script src="../js/performance.js" defer></script>
    <script src="../js/performance-utilities.js" defer></script>
    <script src="../js/cache.js" defer></script>

    <!-- Core Scripts (no defer - load immediately) -->
    <script src="../js/auth.js"></script>
    <script src="../js/api-helper.js"></script>
    
    <!-- UI Scripts (no defer - must load before page scripts) -->
    <script src="../js/top-navbar.js"></script>
    <script src="../js/sidebar-nav.js"></script>
    <script src="../js/navbar.js"></script>
    
    <!-- Page Specific Script (last) -->
    <script src="js/[page-name].js"></script>
</body>
</html>
```

---

## Page-Specific Variations

### Dashboard
- CSS: `Dashboard/css/dashboard.css`
- Script: `Dashboard/js/dashboard.js`
- Wrapper: `.dashboard-container`

### Transaksi (POS)
- CSS: `Transaksi/css/pos-layout.css`
- Script: `Transaksi/pos.js`
- Wrapper: `.pos-wrapper`, `.pos-container`

### Manajemen_Stok
- CSS: `Manajemen_Stok/css/stock-layout.css`
- Script: `Manajemen_Stok/stock-manager.js`
- Wrapper: `.stock-wrapper`, `.stock-container`

### Manajemen_Karyawan
- CSS: `Manajemen_Karyawan/css/employee-layout.css`
- Script: `Manajemen_Karyawan/js/karyawan.js`
- Wrapper: `.employee-wrapper`, `.employee-container`

### Manajemen_Pelanggan
- CSS: `Manajemen_Pelanggan/css/customer-layout.css`
- Script: `Manajemen_Pelanggan/js/pelanggan.js`
- Wrapper: `.customer-wrapper`, `.customer-container`

### Manajemen_Laporan
- CSS: `Manajemen_Laporan/css/report-layout.css`
- Script: `Manajemen_Laporan/js/report.js`
- Wrapper: `.report-wrapper`, `.report-container`

---

## Critical Rules

### CSS Load Order:
1. ✅ Design Tokens & Typography (foundation)
2. ✅ Component CSS (reusable)
3. ✅ Responsive CSS (mobile/tablet)
4. ✅ **Page Specific CSS** (local styles)
5. ✅ **page-adjustments.css** (MUST BE LAST!)

### Why page-adjustments.css Must Be Last?
- Mengatur `margin-left` untuk sidebar
- Mengatur `width` untuk top/bottom navbar
- Override local CSS yang conflict
- Ensure sidebar tidak terpotong

### Script Load Order:
1. ✅ auth.js (authentication first)
2. ✅ api-helper.js (API utilities)
3. ✅ top-navbar.js (navbar injection)
4. ✅ sidebar-nav.js (sidebar injection)
5. ✅ navbar.js (bottom nav injection)
6. ✅ Page-specific JS (last)

---

## Checklist untuk Setiap Halaman:

- [ ] `page-adjustments.css` di-load **paling akhir** sebelum Font Awesome
- [ ] Script order: auth → api-helper → top-navbar → sidebar-nav → navbar → page-specific
- [ ] Tidak ada `layout.js` atau legacy scripts
- [ ] Meta viewport sudah benar
- [ ] Theme color konsisten (#8B4513 atau #0ea5e9)
- [ ] Comment `<!-- Page Adjustments - MUST BE LAST! -->` ada
- [ ] Wrapper class konsisten dengan nama halaman
