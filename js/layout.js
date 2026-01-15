// DigiCaf layout injector
// Purpose: let each page only define its MAIN content, while header + app shell are injected consistently.
(function () {
  if (window.__digicafLayoutInjected) return;
  window.__digicafLayoutInjected = true;

  function getSession() {
    try {
      return window.DigiCafAuth && typeof window.DigiCafAuth.getSession === 'function'
        ? window.DigiCafAuth.getSession()
        : null;
    } catch (e) {
      return null;
    }
  }

  function getUserLabel(fallback) {
    try {
      if (window.DigiCafAuth && typeof window.DigiCafAuth.getUserLabel === 'function') {
        return window.DigiCafAuth.getUserLabel();
      }
    } catch (e) {}
    return fallback || 'Admin';
  }

  function createHeader(appTitle, userLabel) {
    var header = document.createElement('header');
    header.className = 'top-header';
    var session = getSession();
    var showLogout = !!session;
    header.innerHTML =
      '<div class="title">' + appTitle + '</div>' +
      '<div class="user">' +
        '<i class="fas fa-user-circle"></i>' +
        '<span>' + userLabel + '</span>' +
        (showLogout ? '<button type="button" class="digicaf-logout-btn" aria-label="Keluar">Keluar</button>' : '') +
      '</div>';
    return header;
  }

  function createMain() {
    var main = document.createElement('main');
    main.className = 'main';
    return main;
  }

  function getDefaultPageTitle() {
    // Try to derive from <title> e.g. "DigiCaf - Stok" -> "Stok"
    var t = (document.title || '').trim();
    if (!t) return '';
    var parts = t.split(' - ');
    if (parts.length >= 2) return parts.slice(1).join(' - ').trim();
    return t;
  }

  function injectInto(root) {
    if (!root) return;

    // If already has a top header, assume page manages its own layout.
    if (root.querySelector && (root.querySelector('.top-header') || root.querySelector('.header'))) return;

    // Framework7 pages: keep the existing view/page structure intact.
    // We only inject the shared header and app-shell class.
    if (root.querySelector && root.querySelector('.view-main, .view.view-main')) {
      if (!root.classList.contains('app-shell')) root.classList.add('app-shell');
      var f7Header = createHeader(root.getAttribute('data-app-title') || '☕ DigiCaf', root.getAttribute('data-user') || 'Admin');
      root.insertBefore(f7Header, root.firstChild);
      return;
    }

    var appTitle = root.getAttribute('data-app-title') || '☕ DigiCaf';
    var userLabel = getUserLabel(root.getAttribute('data-user') || 'Admin');
    var pageTitle = root.getAttribute('data-page-title') || getDefaultPageTitle();

    // Capture existing children (main content) before we rebuild layout.
    var existing = Array.prototype.slice.call(root.childNodes);
    var hadPageTitle = root.querySelector && root.querySelector('.page-title');

    // If the page already has its own main wrapper, use passthrough mode
    // to avoid double padding.
    var passthroughClasses = ['main-content', 'page-content', 'main'];
    var elementNodes = existing.filter(function (n) { return n && n.nodeType === 1; });
    var passthroughContainer = null;
    if (elementNodes.length === 1) {
      var el = elementNodes[0];
      for (var i = 0; i < passthroughClasses.length; i++) {
        if (el.classList && el.classList.contains(passthroughClasses[i])) {
          passthroughContainer = el;
          break;
        }
      }
    }

    // Clear root
    while (root.firstChild) root.removeChild(root.firstChild);

    // Ensure shell class
    if (!root.classList.contains('app-shell')) root.classList.add('app-shell');

    // Build layout
    var header = createHeader(appTitle, userLabel);
    var main = createMain();

    if (passthroughContainer) {
      main.classList.add('main--passthrough');
    }

    if (!hadPageTitle && pageTitle) {
      var h1 = document.createElement('h1');
      h1.className = 'page-title';
      h1.textContent = pageTitle;
      if (passthroughContainer) {
        passthroughContainer.insertBefore(h1, passthroughContainer.firstChild);
      } else {
        main.appendChild(h1);
      }
    }

    var frag = document.createDocumentFragment();
    existing.forEach(function (n) {
      frag.appendChild(n);
    });
    main.appendChild(frag);

    root.appendChild(header);
    root.appendChild(main);

    // Wire logout button (if present)
    var logoutBtn = header.querySelector && header.querySelector('.digicaf-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (window.DigiCafAuth && typeof window.DigiCafAuth.logout === 'function') {
          window.DigiCafAuth.logout();
        }
      });
    }
  }

  // Opt-in: only inject into elements marked with data-digicaf-layout="auto"
  // This keeps existing pages stable and lets new pages be "content-only".
  document.addEventListener('DOMContentLoaded', function () {
    var roots = document.querySelectorAll('[data-digicaf-layout="auto"]');
    roots.forEach(injectInto);
  });
})();
