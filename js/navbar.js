// Centralized bottom navigation injector and router
(function(){
  // Inject minimal styles for the bottom navigation if not already present
  if (!document.getElementById('navbar-styles')) {
    const css = `
      .bottom-nav{position:fixed !important;bottom:0 !important;left:0 !important;width:100% !important;background:rgba(255,255,255,0.96) !important;backdrop-filter:saturate(140%) blur(8px) !important;border-top:1px solid rgba(0,0,0,0.08) !important;display:flex !important;padding:8px 0 !important;box-shadow:0 -2px 10px rgba(0,0,0,0.08) !important;z-index:999 !important;pointer-events:auto !important;transition:left 0.3s ease, width 0.3s ease !important;}
      @media (min-width: 1025px) {
        .bottom-nav { display: none !important; }
      }
      .bottom-nav .nav-item{flex:1 !important;text-align:center !important;padding:8px 4px !important;cursor:pointer !important;border-radius:10px !important;margin:0 4px !important;color:var(--muted,#666) !important;transition:all .15s !important}
      .bottom-nav .nav-item .nav-icon{display:block !important;font-size:18px !important;margin-bottom:2px !important;line-height:1 !important}
      .bottom-nav .nav-item .nav-label{font-size:11px !important;font-weight:600 !important}
      .bottom-nav .nav-item.active{color:var(--primary,#8B4513) !important;background:rgba(139,69,19,0.08) !important}
      .bottom-nav .nav-item:hover{color:var(--text,#333) !important;background:rgba(0,0,0,0.04) !important}
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
    stock: 'Manajemen_Stok/index.html',
    employee: 'Manajemen_Karyawan/index.html',
    customers: 'Manajemen_Pelanggan/index.html',
    reports: 'Manajemen_Laporan/coffee-pos.html'
  };

  function getNavItems() {
    const role = getRole();
    const all = [
      { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
      { key: 'pos', icon: '🛒', label: 'POS' },
      { key: 'stock', icon: '📦', label: 'Stok' },
      { key: 'employee', icon: '👥', label: 'Karyawan' },
      { key: 'customers', icon: '👤', label: 'Pelanggan' },
      { key: 'reports', icon: '📋', label: 'Laporan' }
    ];

    if (role === 'kasir') {
      return all.filter(i => i.key === 'dashboard' || i.key === 'pos' || i.key === 'stock' || i.key === 'customers');
    }

    // Default/Admin: show all
    return all;
  }

  // Remove any existing bottom-nav to avoid duplicates
  const existing = document.querySelectorAll('.bottom-nav');
  existing.forEach(e => e.remove());

  // Create nav container
  const nav = document.createElement('div');
  nav.className = 'bottom-nav';

  const items = getNavItems();
  nav.innerHTML = items.map(i => `
    <div class="nav-item" data-page="${i.key}">
      <span class="nav-icon">${i.icon}</span>
      <div class="nav-label">${i.label}</div>
    </div>
  `).join('');

  // Append to body and ensure it's on top
  nav.style.zIndex = '2147483647';
  nav.style.pointerEvents = 'auto';
  document.body.appendChild(nav);

  // Resolve a project-root relative path to an absolute URL.
  // Works for http(s) and file:// as long as the project folder name appears in the path.
  function getProjectBaseUrl() {
    try {
      const u = new URL(location.href);

      // If we're running on a web server (e.g. http-server), treat the server root as project root.
      // This prevents incorrect paths like /Dashboard/Transaksi/index.html.
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return u.origin + '/';
      }

      const path = (u.pathname || '').replace(/\\/g, '/');

      // Try to anchor on the repo folder name (works in file:// and many local setups)
      const marker = '/PointOfSale-Coffee-Shop/';
      const idx = path.toLowerCase().lastIndexOf(marker.toLowerCase());
      if (idx !== -1) {
        const basePath = path.slice(0, idx + marker.length);
        return u.origin + basePath;
      }

      // Fallback: use current directory as base
      const dir = path.endsWith('/') ? path : path.slice(0, path.lastIndexOf('/') + 1);
      return u.origin + dir;
    } catch (e) {
      return location.href;
    }
  }

  function resolveUrl(projectRelPath) {
    try {
      return new URL(projectRelPath, getProjectBaseUrl());
    } catch (e) {
      return null;
    }
  }

  // Set active based on current location
  const currPath = location.pathname.replace(/\\/g, '/').toLowerCase();
  items.forEach(({ key: page }) => {
    const targetPath = mapping[page];
    const item = nav.querySelector(`[data-page="${page}"]`);
    if (!item) return;
    
    // Check if current path contains the target path
    // More robust matching for renamed folders
    if (currPath.includes(targetPath.toLowerCase()) || 
        currPath.includes(page.toLowerCase()) ||
        (page === 'dashboard' && currPath.includes('/dashboard/')) ||
        (page === 'pos' && currPath.includes('/transaksi/')) ||
        (page === 'stock' && currPath.includes('/manajemen_stok/')) ||
        (page === 'employee' && currPath.includes('/manajemen_karyawan/')) ||
        (page === 'customers' && currPath.includes('/manajemen_pelanggan/')) ||
        (page === 'reports' && currPath.includes('/manajemen_laporan/'))) {
      item.classList.add('active');
    }
  });

  // Click handlers
  nav.querySelectorAll('.nav-item').forEach(it => {
    it.addEventListener('click', function(e){
      e.preventDefault(); // Prevent default to handle navigation properly
      const page = it.getAttribute('data-page');
      const relPath = mapping[page];
      
      if (!relPath) {
        console.error(`No mapping found for page: ${page}`);
        return;
      }
      
      // Try to resolve URL, fallback to relative path
      const targetUrl = resolveUrl(relPath);
      const finalUrl = targetUrl ? targetUrl.href : relPath;
      
      console.log(`Navigating to ${page}: ${finalUrl}`);
      window.location.href = finalUrl;
    });
  });

})();
