// DigiCaf simple front-end auth/session helper
// NOTE: This is not secure authentication. It's a lightweight gate for demo/local usage.
(function () {
  const STORAGE_KEY = 'digicaf.session.v1';

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function getSession() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const session = raw ? safeJsonParse(raw) : null;
    if (!session || typeof session !== 'object') return null;
    if (!session.userName) return null;
    return session;
  }

  function setSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getNextUrl() {
    const u = new URL(location.href);
    const next = u.searchParams.get('next');
    if (!next) return null;
    try {
      // Support both absolute and relative next
      return new URL(next, location.href).href;
    } catch {
      return null;
    }
  }

  function redirectToLogin() {
    const current = location.href;

    // Resolve project root so subfolder pages (e.g. Dashboard/index.html) redirect to /auth/login.html
    let base;
    try {
      const u = new URL(location.href);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        base = u.origin + '/';
      } else {
        const path = (u.pathname || '').replace(/\\/g, '/');
        const marker = '/PointOfSale-Coffee-Shop-main/';
        const idx = path.toLowerCase().lastIndexOf(marker.toLowerCase());
        if (idx !== -1) {
          base = u.origin + path.slice(0, idx + marker.length);
        } else {
          // fallback to current dir
          const dir = path.endsWith('/') ? path : path.slice(0, path.lastIndexOf('/') + 1);
          base = u.origin + dir;
        }
      }
    } catch {
      base = location.href;
    }

    const loginUrl = new URL('auth/login.html', base);
    loginUrl.searchParams.set('next', current);
    location.replace(loginUrl.href);
  }

  function isLoginPage() {
    const path = (location.pathname || '').toLowerCase();
    return path.endsWith('/login.html') || path.endsWith('login.html');
  }

  function getRole() {
    const s = getSession();
    return (s && s.role ? String(s.role) : '').toLowerCase();
  }

  function getPageKeyFromPath(pathname) {
    const p = String(pathname || '').replace(/\\/g, '/').toLowerCase();
    if (!p) return null;

    // Allow these regardless (no module restriction)
    if (p.endsWith('/') || p.endsWith('/index.html') || p.endsWith('index.html')) {
      // index.html at root is treated as home; keep it allowed
      if (p.endsWith('/pointofsale-coffee-shop-main/index.html') || p === '/index.html' || p.endsWith('/index.html')) {
        // Keep evaluating other pages below; we'll explicitly match modules first.
      }
    }

    if (p.includes('/dashboard/')) return 'dashboard';
    if (p.includes('/transaksi/')) return 'pos';
    if (p.includes('/manejemen_stok/')) return 'stock';
    if (p.includes('/manajemen_pelanggan/')) return 'customers';
    if (p.includes('/manajemen_karyawan/')) return 'employee';
    if (p.includes('/laporan%20pos/') || p.includes('/laporan pos/')) return 'reports';

    return null;
  }

  function isAllowed(role, pageKey) {
    if (!pageKey) return true; // pages we don't categorize are allowed
    if (!role) return false;
    if (role === 'admin') return true;
    if (role === 'kasir') {
      return pageKey === 'dashboard' || pageKey === 'pos' || pageKey === 'stock' || pageKey === 'customers';
    }
    return false;
  }

  function redirectToRoleHome(role) {
    // Keep it simple: Kasir/Admin both land on Dashboard
    try {
      const u = new URL(location.href);
      const base = (u.protocol === 'http:' || u.protocol === 'https:') ? (u.origin + '/') : (u.origin + '/');
      location.replace(new URL('Dashboard/index.html', base).href);
    } catch {
      location.replace('../Dashboard/index.html');
    }
  }

  function warnOnce(message) {
    const key = 'digicaf.warned.access';
    try {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
    } catch {}
    alert(message);
  }

  function requireAuth() {
    // Allow opt-out via meta
    const meta = document.querySelector('meta[name="digicaf-auth"]');
    if (meta && (meta.content || '').toLowerCase() === 'disabled') return;

    if (isLoginPage()) return;

    const session = getSession();
    if (!session) {
      redirectToLogin();
      return;
    }

    // Role-based access control
    const role = getRole();
    const pageKey = getPageKeyFromPath(location.pathname);
    if (!isAllowed(role, pageKey)) {
      warnOnce('Akses ditolak: akun Kasir hanya bisa membuka Dashboard, POS, Stok, dan Pelanggan.');
      redirectToRoleHome(role);
      return;
    }
  }

  function logout() {
    clearSession();
    redirectToLogin();
  }

  function getUserLabel() {
    const s = getSession();
    if (!s) return 'Guest';
    if (s.role) return `${s.userName} • ${s.role}`;
    return s.userName;
  }

  // Expose
  window.DigiCafAuth = {
    STORAGE_KEY,
    getSession,
    setSession,
    clearSession,
    requireAuth,
    logout,
    getUserLabel,
    getNextUrl
  };

  // Auto-enforce on pages that include this script
  document.addEventListener('DOMContentLoaded', function () {
    requireAuth();
  });
})();
