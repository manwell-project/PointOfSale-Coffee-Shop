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

      const email = normalizeEmail($('#email')?.value);
      const pass = ($('#password')?.value || '').trim();

      if (!email) {
        showError('Email wajib diisi.');
        return;
      }
      if (!email.includes('@')) {
        showError('Format email tidak valid.');
        return;
      }
      if (!pass) {
        showError('Password wajib diisi.');
        return;
      }

      const isAdmin = email === ADMIN_EMAIL;
      const isKasir = email === KASIR_EMAIL;

      if (!isAdmin && !isKasir) {
        showError('Akun tidak terdaftar. Gunakan admin@gmail.com atau kasir@gmail.com');
        return;
      }

      if (isAdmin && pass !== ADMIN_PASSWORD) {
        showError('Email atau password Admin salah.');
        return;
      }

      if (isKasir && pass !== KASIR_PASSWORD) {
        showError('Email atau password Kasir salah.');
        return;
      }

      setLoading(true);
      try {
        // Demo-only gate:
        // - Admin/Kasir: fixed credential
        const session = {
          userName: isAdmin ? 'Admin' : 'Kasir',
          role: isAdmin ? 'Admin' : 'Kasir',
          email,
          loginAt: new Date().toISOString()
        };
        if (window.DigiCafAuth && window.DigiCafAuth.setSession) {
          window.DigiCafAuth.setSession(session);
        } else {
          localStorage.setItem('digicaf.session.v1', JSON.stringify(session));
        }

        redirectAfterLogin();
      } catch (err) {
        showError(err?.message || 'Gagal login. Coba lagi.');
      } finally {
        setLoading(false);
      }
    });
  });
})();
