/**
 * Sidebar Navigation Component - Phase 10.3
 * Desktop sidebar with collapsible menu, submenu support, and active state management
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    storageKey: 'digicaf-sidebar-collapsed',
    activeClass: 'active',
    collapsedClass: 'collapsed',
    openClass: 'open',
    mobileBreakpoint: 768,
  };

  // State
  let currentUser = null;
  let isCollapsed = false;
  let isMobile = false;

  /**
   * Initialize Sidebar Navigation
   */
  function init() {
    // Check if mobile
    checkMobile();
    
    // Get current user
    currentUser = getUserFromSession();
    
    // Load collapse state from storage
    loadCollapseState();
    
    // Inject sidebar HTML
    injectSidebarHTML();
    
    // Setup event listeners
    setupEventListeners();
    
    // Set active menu item
    setActiveMenuItem();
    
    // Apply body class for content offset
    if (!isMobile) {
      document.body.classList.add('sidebar-visible');
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      }
    }
    
    console.log('[Sidebar] Initialized successfully');
  }

  /**
   * Check if mobile viewport
   */
  function checkMobile() {
    isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    
    window.addEventListener('resize', () => {
      const wasMobile = isMobile;
      isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
      
      if (wasMobile !== isMobile) {
        handleResponsiveChange();
      }
    });
  }

  /**
   * Handle responsive viewport change
   */
  function handleResponsiveChange() {
    const sidebar = document.querySelector('.sidebar-nav');
    if (!sidebar) return;

    if (isMobile) {
      document.body.classList.remove('sidebar-visible', 'sidebar-collapsed');
      sidebar.classList.remove('mobile-open');
      closeMobileOverlay();
    } else {
      document.body.classList.add('sidebar-visible');
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      }
    }
  }

  /**
   * Get user from session
   */
  function getUserFromSession() {
    try {
      if (window.DigiCafAuth && typeof window.DigiCafAuth.getSession === 'function') {
        return window.DigiCafAuth.getSession();
      }
      
      const sessionStr = localStorage.getItem('session');
      if (sessionStr) {
        return JSON.parse(sessionStr);
      }
    } catch (err) {
      console.error('[Sidebar] Error getting user session:', err);
    }
    
    return {
      username: 'Admin',
      role: 'admin',
      email: 'admin@digicaf.com'
    };
  }

  /**
   * Load collapse state from localStorage
   */
  function loadCollapseState() {
    try {
      const stored = localStorage.getItem(CONFIG.storageKey);
      isCollapsed = stored === 'true';
    } catch (err) {
      console.error('[Sidebar] Error loading collapse state:', err);
    }
  }

  /**
   * Save collapse state to localStorage
   */
  function saveCollapseState() {
    try {
      localStorage.setItem(CONFIG.storageKey, isCollapsed);
    } catch (err) {
      console.error('[Sidebar] Error saving collapse state:', err);
    }
  }

  /**
   * Inject sidebar HTML
   */
  function injectSidebarHTML() {
    const existingSidebar = document.querySelector('.sidebar-nav');
    if (existingSidebar) {
      existingSidebar.remove();
    }

    const userName = currentUser?.username || 'Admin';
    const userRole = currentUser?.role || 'admin';
    const userInitial = userName.charAt(0).toUpperCase();
    const roleLabel = userRole === 'admin' ? 'Administrator' : 'Kasir';

    // Build menu items based on user role
    const menuItems = getMenuItems(userRole);

    const sidebarHTML = `
      <aside class="sidebar-nav ${isCollapsed ? 'collapsed' : ''}">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <span class="sidebar-brand-icon">☕</span>
            <span class="sidebar-brand-text">DigiCaf</span>
          </div>
          <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle Sidebar">
            <i class="fas fa-chevron-left"></i>
          </button>
        </div>

        <!-- Sidebar Menu -->
        <nav class="sidebar-menu" id="sidebarMenu">
          ${renderMenuSections(menuItems)}
        </nav>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-user-avatar">${userInitial}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${userName}</div>
              <div class="sidebar-user-role">${roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile Overlay -->
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
  }

  /**
   * Get menu items based on user role
   */
  function getMenuItems(role) {
    const allItems = [
      {
        section: 'Main',
        items: [
          {
            icon: 'fas fa-home',
            text: 'Dashboard',
            url: '../Dashboard/index.html',
            key: 'dashboard'
          },
          {
            icon: 'fas fa-cash-register',
            text: 'Point of Sale',
            url: '../Transaksi/index.html',
            key: 'pos'
          }
        ]
      },
      {
        section: 'Manajemen',
        items: [
          {
            icon: 'fas fa-box',
            text: 'Stok Produk',
            url: '../Manajemen_Stok/index.html',
            key: 'stock'
          },
          {
            icon: 'fas fa-users',
            text: 'Karyawan',
            url: '../Manajemen_Karyawan/index.html',
            key: 'employee'
          },
          {
            icon: 'fas fa-user-friends',
            text: 'Pelanggan',
            url: '../Manajemen_Pelanggan/index.html',
            key: 'customers'
          }
        ]
      },
      {
        section: 'Laporan',
        items: [
          {
            icon: 'fas fa-chart-line',
            text: 'Laporan Penjualan',
            url: '../Manajemen_Laporan/coffee-pos.html',
            key: 'reports'
          }
        ]
      }
    ];

    // Filter based on role
    if (role !== 'admin') {
      return allItems.map(section => ({
        ...section,
        items: section.items.filter(item => !item.adminOnly)
      })).filter(section => section.items.length > 0);
    }

    return allItems;
  }

  /**
   * Render menu sections
   */
  function renderMenuSections(sections) {
    return sections.map(section => `
      <div class="sidebar-menu-section">
        <div class="sidebar-menu-section-title">${section.section}</div>
        ${section.items.map(item => renderMenuItem(item)).join('')}
      </div>
    `).join('');
  }

  /**
   * Render single menu item
   */
  function renderMenuItem(item) {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const badge = item.badge ? `<span class="sidebar-menu-badge">${item.badge}</span>` : '';
    const arrow = hasSubmenu ? '<i class="fas fa-chevron-right sidebar-menu-arrow"></i>' : '';
    
    let html = `
      <div class="sidebar-menu-item">
        <a href="${hasSubmenu ? '#' : item.url}" class="sidebar-menu-link" data-key="${item.key}">
          <span class="sidebar-menu-icon"><i class="${item.icon}"></i></span>
          <span class="sidebar-menu-text">${item.text}</span>
          ${badge}
          ${arrow}
          <span class="sidebar-tooltip">${item.text}</span>
        </a>
    `;

    if (hasSubmenu) {
      html += `
        <div class="sidebar-submenu">
          ${item.submenu.map(sub => `
            <a href="${sub.url}" class="sidebar-submenu-link" data-key="${sub.key}">
              <span>${sub.text}</span>
            </a>
          `).join('')}
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Toggle button
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleCollapse);
    }

    // Mobile overlay
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      overlay.addEventListener('click', closeMobileSidebar);
    }

    // Menu items with submenu
    const menuLinks = document.querySelectorAll('.sidebar-menu-link');
    menuLinks.forEach(link => {
      const hasSubmenu = link.querySelector('.sidebar-menu-arrow');
      if (hasSubmenu) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          toggleSubmenu(link);
        });
      }
    });
  }

  /**
   * Toggle sidebar collapse
   */
  function toggleCollapse() {
    const sidebar = document.querySelector('.sidebar-nav');
    if (!sidebar || isMobile) return;

    isCollapsed = !isCollapsed;
    
    sidebar.classList.toggle(CONFIG.collapsedClass);
    document.body.classList.toggle('sidebar-collapsed');
    
    saveCollapseState();

    // Close all submenus when collapsing
    if (isCollapsed) {
      closeAllSubmenus();
    }
  }

  /**
   * Toggle submenu
   */
  function toggleSubmenu(link) {
    if (isCollapsed) return;

    const submenu = link.parentElement.querySelector('.sidebar-submenu');
    if (!submenu) return;

    const isOpen = link.classList.contains(CONFIG.openClass);

    // Close other submenus
    closeAllSubmenus();

    if (!isOpen) {
      link.classList.add(CONFIG.openClass);
      submenu.classList.add(CONFIG.openClass);
    }
  }

  /**
   * Close all submenus
   */
  function closeAllSubmenus() {
    const openLinks = document.querySelectorAll('.sidebar-menu-link.open');
    const openSubmenus = document.querySelectorAll('.sidebar-submenu.open');
    
    openLinks.forEach(link => link.classList.remove(CONFIG.openClass));
    openSubmenus.forEach(submenu => submenu.classList.remove(CONFIG.openClass));
  }

  /**
   * Set active menu item based on current URL
   */
  function setActiveMenuItem() {
    const currentPath = window.location.pathname.toLowerCase();
    const menuLinks = document.querySelectorAll('.sidebar-menu-link, .sidebar-submenu-link');
    
    menuLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      try {
        const linkPath = new URL(href, window.location.origin).pathname.toLowerCase();
        
        if (currentPath.includes(linkPath) || linkPath.includes(currentPath)) {
          link.classList.add(CONFIG.activeClass);
          
          // If it's a submenu link, open parent submenu
          if (link.classList.contains('sidebar-submenu-link')) {
            const parentItem = link.closest('.sidebar-menu-item');
            const parentLink = parentItem?.querySelector('.sidebar-menu-link');
            const submenu = parentItem?.querySelector('.sidebar-submenu');
            
            if (parentLink && submenu && !isCollapsed) {
              parentLink.classList.add(CONFIG.openClass);
              submenu.classList.add(CONFIG.openClass);
            }
          }
        }
      } catch (err) {
        console.error('[Sidebar] Error processing link:', err);
      }
    });
  }

  /**
   * Open mobile sidebar
   */
  function openMobileSidebar() {
    if (!isMobile) return;

    const sidebar = document.querySelector('.sidebar-nav');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
    
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close mobile sidebar
   */
  function closeMobileSidebar() {
    if (!isMobile) return;

    const sidebar = document.querySelector('.sidebar-nav');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
    
    document.body.style.overflow = '';
  }

  /**
   * Close mobile overlay
   */
  function closeMobileOverlay() {
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external use
  window.SidebarNav = {
    init,
    toggleCollapse,
    openMobileSidebar,
    closeMobileSidebar,
    setActiveMenuItem
  };

})();
