(function () {
  const ADMIN_EMAIL = 'admin@gmail.com';
  const ADMIN_PASSWORD = '123456';
  const KASIR_EMAIL = 'kasir@gmail.com';
  const KASIR_PASSWORD = '123456';

  function $(sel) {
    return document.querySelector(sel);
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function showError(message) {
    const el = $('#loginError');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
  }

  function clearError() {
    const el = $('#loginError');
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
  }

  function setLoading(isLoading) {
    const btn = $('#loginBtn');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Memproses…' : 'Masuk';
  }

  function getDashboardUrl() {
    const rel = '../Dashboard/index.html';
    try {
      return new URL(rel, location.href).href;
    } catch {
      return rel;
    }
  }

  function redirectAfterLogin() {
    // Requirement: Admin dan Kasir setelah login langsung ke Dashboard
    // (abaikan parameter `next` agar konsisten)
    location.replace(getDashboardUrl());
  }

  document.addEventListener('DOMContentLoaded', function () {
    // If already logged in, skip login page
    const existing = window.DigiCafAuth && window.DigiCafAuth.getSession ? window.DigiCafAuth.getSession() : null;
    if (existing) {
      redirectAfterLogin();
      return;
    }

    const form = $('#loginForm');
    const toggle = $('#togglePassword');
    const password = $('#password');

    if (toggle && password) {
      toggle.addEventListener('click', function () {
        const isHidden = password.type === 'password';
        password.type = isHidden ? 'text' : 'password';
        toggle.textContent = isHidden ? 'Sembunyikan' : 'Tampilkan';
      });
    }

    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearError();

      const identifier = normalizeEmail($('#email')?.value);
      const pass = ($('#password')?.value || '').trim();

      if (!identifier) {
        showError('Username atau email wajib diisi.');
        return;
      }
      if (!pass) {
        showError('Password wajib diisi.');
        return;
      }

      setLoading(true);
      try {
        // Try server-side auth first (username/email + password)
        let resp;
        try {
          resp = await window.API.apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier: identifier, password: pass })
          });
        } catch (apiError) {
          // If the backend actively rejected it (401 etc), show that error!
          if (apiError.message && (apiError.message.includes('salah') || apiError.message.includes('tidak ditemukan') || apiError.message.includes('terdaftar'))) {
            throw apiError; 
          }
          // Otherwise, it might be a network error, so will use fallback below
          resp = null;
        }

        if (resp && resp.success && resp.session) {
          const session = resp.session;
          if (window.DigiCafAuth && window.DigiCafAuth.setSession) {
            window.DigiCafAuth.setSession(session);
          } else {
            localStorage.setItem('digicaf.session.v1', JSON.stringify(session));
          }
          redirectAfterLogin();
          return;
        }

        // Fallback to legacy demo accounts if server returned unexpected response
        const isAdmin = identifier === ADMIN_EMAIL;
        const isKasir = identifier === KASIR_EMAIL;
        if (isAdmin && pass === ADMIN_PASSWORD) {
          const session = { userName: 'Admin', role: 'Admin', email: identifier, loginAt: new Date().toISOString() };
          if (window.DigiCafAuth && window.DigiCafAuth.setSession) window.DigiCafAuth.setSession(session);
          else localStorage.setItem('digicaf.session.v1', JSON.stringify(session));
          redirectAfterLogin();
          return;
        }
        if (isKasir && pass === KASIR_PASSWORD) {
          const session = { userName: 'Kasir', role: 'Kasir', email: identifier, loginAt: new Date().toISOString() };
          if (window.DigiCafAuth && window.DigiCafAuth.setSession) window.DigiCafAuth.setSession(session);
          else localStorage.setItem('digicaf.session.v1', JSON.stringify(session));
          redirectAfterLogin();
          return;
        }

        showError('Username/email atau password salah.');
      } catch (err) {
        // If API returns 401 or other error, show its message when available
        showError(err?.message || 'Gagal login. Coba lagi.');
      } finally {
        setLoading(false);
      }
    });
  });
})();
