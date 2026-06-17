// Centralized bottom navigation injector and router
(function(){
  function shouldDisableBottomNav() {
    try {
      if (document.body && document.body.classList.contains('no-bottom-nav')) return true;
      if (document.documentElement && String(document.documentElement.getAttribute('data-bottom-nav')).toLowerCase() === 'off') return true;
      if (document.querySelector && document.querySelector('[data-bottom-nav="off"]')) return true;

      // If the sidebar nav script or sidebar exists, prefer sidebar on wide screens.
      // But allow the mobile snackbar when viewport is narrow (mobile devices).
      const isWide = (typeof window !== 'undefined' && window.innerWidth >= 768);
      if (isWide) {
        if (document.querySelector && document.querySelector('script[src*="sidebar-nav.js"]')) return true;
        if (document.querySelector && document.querySelector('.sidebar-nav')) return true;
      }
    } catch (e) {
      // default to enabled
    }
    return false;
  }

  if (shouldDisableBottomNav()) {
    try {
      document.querySelectorAll('.bottom-nav').forEach(e => e.remove());
    } catch (e) {}
    return;
  }

  // If a previous init injected the nav, remove it before re-creating to avoid duplicates.
  try {
    document.querySelectorAll('.bottom-nav').forEach(e => e.remove());
    document.querySelectorAll('.bottom-submenu').forEach(e => e.remove());
  } catch (e) {}

  // Inject minimal styles for the bottom navigation if not already present
  if (!document.getElementById('navbar-styles')) {
    const css = `
      .bottom-nav-wrapper{position:fixed;bottom:0;left:0;right:0;z-index:2147483647;pointer-events:auto;touch-action:manipulation}
      .bottom-nav{background:rgba(255,255,255,0.98) !important;backdrop-filter:saturate(140%) blur(8px) !important;border-top:1px solid rgba(0,0,0,0.08) !important;display:flex !important;padding:8px 6px !important;box-shadow:0 -6px 20px rgba(0,0,0,0.08) !important;border-radius:12px 12px 0 0 !important;flex-wrap:wrap !important;gap:4px !important}
      @media (min-width: 768px) {
        .bottom-nav-wrapper { display: none !important; }
      }
      .bottom-nav .nav-item{flex:0 1 calc(25% - 6px) !important;text-align:center !important;padding:8px 6px !important;cursor:pointer !important;border-radius:10px !important;color:var(--muted,#666) !important;transition:all .15s !important;font-family:inherit;user-select:none !important;-webkit-tap-highlight-color:transparent !important;touch-action:manipulation !important;border:none !important;background:transparent !important;appearance:none !important;text-decoration:none !important}
      .bottom-nav .nav-item .nav-icon{display:block !important;font-size:18px !important;margin-bottom:4px !important;line-height:1 !important}
      .bottom-nav .nav-item .nav-label{font-size:11px !important;font-weight:600 !important}
      .bottom-nav .nav-item.active{color:var(--primary,#8B4513) !important;background:rgba(139,69,19,0.06) !important}
      .bottom-nav .nav-item:hover{color:var(--text,#333) !important;background:rgba(0,0,0,0.04) !important}

      /* Submenu row inline */
      .bottom-submenu-row{display:none !important;background:#f9f9f9 !important;border-top:1px solid rgba(0,0,0,0.08) !important;padding:12px 6px !important;gap:6px !important;flex-wrap:wrap !important;max-height:120px !important;overflow-y:auto !important;min-height:60px !important;z-index:2147483648 !important;margin-bottom:6px !important}
      .bottom-submenu-row.open{display:flex !important}
      .bottom-submenu-item{flex:0 1 calc(50% - 6px) !important;padding:18px 12px !important;border-radius:8px !important;background:#fff !important;border:1px solid rgba(0,0,0,0.1) !important;text-align:center !important;font-weight:700 !important;font-size:15px !important;color:#333 !important;cursor:pointer !important;text-decoration:none !important;pointer-events:auto !important;touch-action:manipulation !important;-webkit-tap-highlight-color:transparent !important;transition:all 0.15s !important;display:block !important}
      .bottom-submenu-item:active{background:rgba(139,69,19,0.2) !important}
    `;
    const s = document.createElement('style');
    s.id = 'navbar-styles';
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  function getRole() {
    try {
      const s = window.DigiCafAuth && typeof window.DigiCafAuth.getSession === 'function'
        ? window.DigiCafAuth.getSession()
        : null;
      return (s && s.role ? String(s.role) : '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  // Mapping of logical pages to project-root relative paths
  // (we resolve these against the project base URL so they work from ANY folder)
  const mapping = {
    dashboard: 'Dashboard/index.html',
    pos: 'Transaksi/index.html',
    stok_produk: 'Manajemen_Stok/index.html',
    kelola_menu: 'kelola-menu/index.html',
    karyawan: 'Manajemen_Karyawan/index.html',
    pelanggan: 'Manajemen_Pelanggan/index.html',
    diskon: 'Manajemen_Diskon/index.html',
    riwayat_transaksi: 'Riwayat_Transaksi/index.html',
    laporan_penjualan: 'Manajemen_Laporan/coffee-pos.html'
  };

  function getNavItems() {
    const role = getRole();

    // Required order and structure for the user:
    // - Beranda / Dashboard
    // - Point of Sale
    // - Manajemen (submenu)
    // - Laporan (submenu)
    const items = [
      { key: 'dashboard', icon: 'fas fa-house', label: 'Beranda' },
      { key: 'pos', icon: 'fas fa-cash-register', label: 'Point of Sale' },
      { key: 'manajemen', icon: 'fas fa-layer-group', label: 'Manajemen', submenu: [
        { key: 'stok_produk', label: 'Stok Produk' },
        { key: 'kelola_menu', label: 'Kelola Menu' },
        { key: 'karyawan', label: 'Karyawan' },
        { key: 'pelanggan', label: 'Pelanggan' },
        { key: 'diskon', label: 'Diskon' }
      ]},
      { key: 'laporan', icon: 'fas fa-chart-line', label: 'Laporan', submenu: [
        { key: 'riwayat_transaksi', label: 'Riwayat Transaksi' },
        { key: 'laporan_penjualan', label: 'Laporan Penjualan' }
      ]}
    ];

    // Role-based filtering: kasir sees fewer items
    if (role === 'kasir') {
      return items.filter(i => i.key === 'dashboard' || i.key === 'pos' || i.key === 'manajemen');
    }

    return items;
  }

  // Resolve a project-root relative path to an absolute URL.
  // Works for http(s) and file:// as long as the project folder name appears in the path.
  function getProjectBaseUrl() {
    try {
      const u = new URL(location.href);
      const href = String(u.href || '').replace(/\\/g, '/');

      const path = (u.pathname || '').replace(/\\/g, '/');

      // Try to anchor on the repo folder name (works in file:// and many local setups)
      const marker = '/PointOfSale-Coffee-Shop/';
      const idx = href.toLowerCase().lastIndexOf(marker.toLowerCase());
      if (idx !== -1) {
        return href.slice(0, idx + marker.length);
      }

      // If served from the web root, keep the origin root.
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return u.origin + '/';
      }

      // Fallback: use current directory as base
      const dir = href.endsWith('/') ? href : href.slice(0, href.lastIndexOf('/') + 1);
      return dir;
    } catch (e) {
      return location.href;
    }
  }

  function resolveUrl(projectRelPath) {
    try {
      return new URL(projectRelPath, getProjectBaseUrl());
    } catch (e) {
      try {
        return { href: getProjectBaseUrl().replace(/\/$/, '') + '/' + String(projectRelPath || '').replace(/^\//, '') };
      } catch (err) {
        return null;
      }
    }
  }

  // Create nav container wrapper
  const navWrapper = document.createElement('div');
  navWrapper.className = 'bottom-nav-wrapper';

  const nav = document.createElement('div');
  nav.className = 'bottom-nav';

  const items = getNavItems();
  
  // Generate ONLY main level items (4 items: Beranda, POS, Manajemen, Laporan)
  const mainItems = items.filter(i => !i.submenu || !Array.isArray(i.submenu) || i.submenu.length === 0).length > 0 
    ? items 
    : items.map(i => ({ key: i.key, icon: i.icon, label: i.label }));
  
  nav.innerHTML = mainItems.map(i => {
    if (i.submenu && i.submenu.length > 0) {
      // Item with submenu - make it a button
      return `<button type="button" class="nav-item" data-submenu="${i.key}" aria-label="${i.label}"><span class="nav-icon"><i class="${i.icon}"></i></span><div class="nav-label">${i.label}</div></button>`;
    }
    // Regular items - make them links
    return `<a href="${resolveUrl(mapping[i.key])?.href || '#'}" class="nav-item" aria-label="${i.label}"><span class="nav-icon"><i class="${i.icon}"></i></span><div class="nav-label">${i.label}</div></a>`;
  }).join('');
  // Create submenu row (will appear above nav when a submenu item is clicked)
  const submenuRow = document.createElement('div');
  submenuRow.className = 'bottom-submenu-row';
  submenuRow.id = 'bottomSubmenuRow';

  // Append submenu first so it appears above the nav visually
  navWrapper.appendChild(submenuRow);
  navWrapper.appendChild(nav);

  navWrapper.style.pointerEvents = 'auto';
  document.body.appendChild(navWrapper);

  // Set active based on current location
  const currPath = location.pathname.replace(/\\/g, '/').toLowerCase();
  mainItems.forEach(({ key: page }) => {
    let item = nav.querySelector(`[data-submenu="${page}"]`);
    if (!item) {
      item = Array.from(nav.querySelectorAll('a')).find(a => a.href.includes(page));
    }
    if (!item) return;
    
    // Check if current path matches this page
    const isActive = 
      (page === 'dashboard' && currPath.includes('/dashboard/')) ||
      (page === 'pos' && currPath.includes('/transaksi/')) ||
      (page === 'manajemen' && currPath.includes('/manajemen_')) ||
      (page === 'laporan' && (currPath.includes('/manajemen_laporan/') || currPath.includes('/riwayat_transaksi/')));
    
    if (isActive) {
      item.classList.add('active');
    }
  });

  // Click handlers via delegation for better mobile reliability
  nav.addEventListener('click', function(e) {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;

    const submenuKey = btn.getAttribute('data-submenu');
    if (!submenuKey) return; // Regular link, let it navigate
    
    e.preventDefault();
    e.stopPropagation();

    // Get submenu items
    const itemsMap = getNavItems().reduce((acc, cur) => { acc[cur.key] = cur; return acc; }, {});
    const sub = itemsMap[submenuKey];
    
    if (!sub || !sub.submenu || sub.submenu.length === 0) return;

    // Toggle or open submenu row
    if (submenuRow.classList.contains('open') && submenuRow.dataset.parentKey === submenuKey) {
      submenuRow.classList.remove('open');
      return;
    }

    // Populate submenu row
    submenuRow.dataset.parentKey = submenuKey;
    submenuRow.innerHTML = (sub.submenu || []).map(si => {
      const url = resolveUrl(mapping[si.key]);
      // Always render the item; if URL can't be resolved, link to '#'
      return `<a href="${url && url.href ? url.href : '#'}" class="bottom-submenu-item" data-key="${si.key}">${si.label}</a>`;
    }).join('');
    
    // Ensure submenu is visible and above other elements
    submenuRow.classList.add('open');
    try {
      submenuRow.style.display = 'flex';
      submenuRow.style.zIndex = '2147483648';
      submenuRow.style.position = 'relative';
      submenuRow.style.visibility = 'visible';
      submenuRow.style.pointerEvents = 'auto';
    } catch (e) {}
  });

  // Close submenu when clicking outside
  document.addEventListener('click', function(ev){
    if (!ev.target.closest('.bottom-nav-wrapper')) {
      submenuRow.classList.remove('open');
    }
  });

})();
