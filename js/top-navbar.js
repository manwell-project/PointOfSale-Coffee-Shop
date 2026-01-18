/**
 * Top Navigation Bar Component - Phase 10.1
 * Handles search, notifications, user menu, mobile menu, breadcrumbs
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    scrollThreshold: 50,
    searchDebounceMs: 300,
    notificationCheckInterval: 60000, // Check every minute
  };

  // State
  let searchTimeout = null;
  let currentUser = null;
  let notifications = [];

  /**
   * Initialize Top Navbar
   */
  function init() {
    // Get current user from auth session
    currentUser = getUserFromSession();
    
    // Inject navbar HTML
    injectNavbarHTML();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize components
    initializeSearch();
    initializeNotifications();
    initializeUserMenu();
    initializeMobileMenu();
    initializeBreadcrumbs();
    
    // Setup scroll behavior
    setupScrollBehavior();
    
    console.log('[TopNavbar] Initialized successfully');
  }

  /**
   * Get user from session
   */
  function getUserFromSession() {
    try {
      if (window.DigiCafAuth && typeof window.DigiCafAuth.getSession === 'function') {
        return window.DigiCafAuth.getSession();
      }
      
      // Fallback to localStorage
      const sessionStr = localStorage.getItem('session');
      if (sessionStr) {
        return JSON.parse(sessionStr);
      }
    } catch (err) {
      console.error('[TopNavbar] Error getting user session:', err);
    }
    
    return {
      username: 'Admin',
      role: 'admin',
      email: 'admin@digicaf.com'
    };
  }

  /**
   * Inject navbar HTML
   */
  function injectNavbarHTML() {
    const existingNavbar = document.querySelector('.top-navbar');
    if (existingNavbar) {
      existingNavbar.remove();
    }

    const userName = currentUser?.username || 'Admin';
    const userRole = currentUser?.role || 'admin';
    const userInitial = userName.charAt(0).toUpperCase();
    const roleLabel = userRole === 'admin' ? 'Administrator' : 'Kasir';

    const navbarHTML = `
      <nav class="top-navbar">
        <div class="top-navbar-inner">
          <!-- Left Section -->
          <div class="top-navbar-left">
            <button class="top-navbar-menu-toggle" id="mobileMenuToggle" aria-label="Toggle Menu">
              <i class="fas fa-bars"></i>
            </button>
            
            <a href="/webtest/PointOfSale-Coffee-Shop/Dashboard/index.html" class="top-navbar-logo">
              <span class="top-navbar-logo-icon">☕</span>
              <span class="top-navbar-brand">DigiCaf</span>
            </a>
          </div>

          <!-- Center Section - Search -->
          <div class="top-navbar-center">
            <div class="top-navbar-search">
              <i class="fas fa-search top-navbar-search-icon"></i>
              <input 
                type="text" 
                class="top-navbar-search-input" 
                id="topNavbarSearch"
                placeholder="Cari menu, transaksi, atau pelanggan..."
                autocomplete="off"
              />
              <div class="top-navbar-search-results" id="searchResults"></div>
            </div>
          </div>

          <!-- Right Section - Actions & User -->
          <div class="top-navbar-right">
            <!-- Notifications -->
            <div style="position: relative;">
              <button class="top-navbar-action-btn" id="notificationBtn" aria-label="Notifications">
                <i class="fas fa-bell"></i>
                <span class="top-navbar-badge" id="notificationBadge" style="display: none;">0</span>
              </button>
              <div class="top-navbar-dropdown" id="notificationDropdown">
                <div class="top-navbar-dropdown-header">
                  Notifikasi
                </div>
                <div class="top-navbar-dropdown-body" id="notificationList">
                  <div class="top-navbar-dropdown-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p class="top-navbar-dropdown-empty-text">Tidak ada notifikasi baru</p>
                  </div>
                </div>
                <div class="top-navbar-dropdown-footer">
                  <a href="#" id="markAllRead">Tandai Semua Dibaca</a>
                </div>
              </div>
            </div>

            <!-- User Menu -->
            <div style="position: relative;">
              <button class="top-navbar-user-btn" id="userMenuBtn">
                <div class="top-navbar-user-avatar">${userInitial}</div>
                <div class="top-navbar-user-info">
                  <div class="top-navbar-user-name">${userName}</div>
                  <div class="top-navbar-user-role">${roleLabel}</div>
                </div>
                <i class="fas fa-chevron-down top-navbar-user-caret"></i>
              </button>
              <div class="top-navbar-dropdown top-navbar-user-dropdown" id="userDropdown">
                <div class="top-navbar-dropdown-body">
                  <a href="#" class="top-navbar-dropdown-item">
                    <div class="top-navbar-dropdown-item-icon primary">
                      <i class="fas fa-user"></i>
                    </div>
                    <div class="top-navbar-dropdown-item-content">
                      <div class="top-navbar-dropdown-item-title">Profil Saya</div>
                    </div>
                  </a>
                  <a href="#" class="top-navbar-dropdown-item">
                    <div class="top-navbar-dropdown-item-icon">
                      <i class="fas fa-cog"></i>
                    </div>
                    <div class="top-navbar-dropdown-item-content">
                      <div class="top-navbar-dropdown-item-title">Pengaturan</div>
                    </div>
                  </a>
                  <div class="top-navbar-divider"></div>
                  <a href="#" class="top-navbar-dropdown-item" id="logoutBtn">
                    <div class="top-navbar-dropdown-item-icon danger">
                      <i class="fas fa-sign-out-alt"></i>
                    </div>
                    <div class="top-navbar-dropdown-item-content">
                      <div class="top-navbar-dropdown-item-title">Keluar</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Mobile Menu -->
      <div class="top-navbar-mobile-overlay" id="mobileOverlay"></div>
      <div class="top-navbar-mobile-menu" id="mobileMenu">
        <a href="/webtest/PointOfSale-Coffee-Shop/Dashboard/index.html" class="top-navbar-mobile-nav-item">
          <i class="fas fa-home"></i>
          <span>Dashboard</span>
        </a>
        <a href="/webtest/PointOfSale-Coffee-Shop/Transaksi/index.html" class="top-navbar-mobile-nav-item">
          <i class="fas fa-cash-register"></i>
          <span>Point of Sale</span>
        </a>
        <a href="/webtest/PointOfSale-Coffee-Shop/Manejemen_stok/index.html" class="top-navbar-mobile-nav-item">
          <i class="fas fa-box"></i>
          <span>Manajemen Stok</span>
        </a>
        ${userRole === 'admin' ? `
        <a href="/webtest/PointOfSale-Coffee-Shop/Manajemen_Karyawan/index.html" class="top-navbar-mobile-nav-item">
          <i class="fas fa-users"></i>
          <span>Manajemen Karyawan</span>
        </a>
        ` : ''}
        <a href="/webtest/PointOfSale-Coffee-Shop/Manajemen_Pelanggan/index.html" class="top-navbar-mobile-nav-item">
          <i class="fas fa-user-friends"></i>
          <span>Manajemen Pelanggan</span>
        </a>
        <a href="/webtest/PointOfSale-Coffee-Shop/Laporan POS/coffee-pos.html" class="top-navbar-mobile-nav-item">
          <i class="fas fa-chart-line"></i>
          <span>Laporan</span>
        </a>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Add trigger area for showing hidden navbar
    const triggerArea = document.createElement('div');
    triggerArea.className = 'top-navbar-trigger';
    triggerArea.addEventListener('mouseenter', () => {
      const navbar = document.querySelector('.top-navbar');
      if (navbar && navbar.classList.contains('hidden')) {
        navbar.classList.remove('hidden');
      }
    });
    document.body.insertAdjacentElement('afterbegin', triggerArea);
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', handleOutsideClick);
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Mark all read button
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', handleMarkAllRead);
    }
  }

  /**
   * Initialize search functionality
   */
  function initializeSearch() {
    const searchInput = document.getElementById('topNavbarSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      clearTimeout(searchTimeout);
      
      if (query.length < 2) {
        searchResults.classList.remove('active');
        return;
      }

      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, CONFIG.searchDebounceMs);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2) {
        searchResults.classList.add('active');
      }
    });
  }

  /**
   * Perform search across different entities
   */
  async function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    try {
      // Show loading
      searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: #666;">Mencari...</div>';
      searchResults.classList.add('active');

      // Search in different categories
      const results = await searchAllCategories(query);

      if (results.length === 0) {
        searchResults.innerHTML = `
          <div class="top-navbar-search-empty">
            <i class="fas fa-search"></i>
            <p>Tidak ada hasil untuk "${escapeHtml(query)}"</p>
          </div>
        `;
      } else {
        searchResults.innerHTML = results.map(result => `
          <div class="top-navbar-search-result-item" data-url="${result.url}">
            <div class="top-navbar-search-result-icon">
              <i class="${result.icon}"></i>
            </div>
            <div class="top-navbar-search-result-content">
              <div class="top-navbar-search-result-title">${escapeHtml(result.title)}</div>
              <div class="top-navbar-search-result-subtitle">${escapeHtml(result.subtitle)}</div>
            </div>
          </div>
        `).join('');

        // Add click handlers
        searchResults.querySelectorAll('.top-navbar-search-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const url = item.dataset.url;
            if (url) {
              window.location.href = url;
            }
          });
        });
      }
    } catch (err) {
      console.error('[TopNavbar] Search error:', err);
      searchResults.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #DC3545;">
          <i class="fas fa-exclamation-triangle"></i>
          Error saat mencari
        </div>
      `;
    }
  }

  /**
   * Search across all categories
   */
  async function searchAllCategories(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    try {
      // Search in products/menu
      if (window.API && window.API.Products) {
        const products = await window.API.Products.getAll();
        const matchingProducts = products.filter(p => 
          p.name?.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);
        
        matchingProducts.forEach(p => {
          results.push({
            icon: 'fas fa-coffee',
            title: p.name,
            subtitle: `Produk • ${formatRupiah(p.price)}`,
            url: '/webtest/PointOfSale-Coffee-Shop/Manejemen_stok/index.html'
          });
        });
      }

      // Search in customers
      if (window.API && window.API.Customers) {
        const customers = await window.API.Customers.getAll();
        const matchingCustomers = customers.filter(c => 
          c.name?.toLowerCase().includes(lowerQuery) || 
          c.phone?.includes(query)
        ).slice(0, 3);
        
        matchingCustomers.forEach(c => {
          results.push({
            icon: 'fas fa-user',
            title: c.name,
            subtitle: `Pelanggan • ${c.phone}`,
            url: '/webtest/PointOfSale-Coffee-Shop/Manajemen_Pelanggan/index.html'
          });
        });
      }

      // Search in transactions (by ID)
      if (window.API && window.API.Transactions && /^\d+$/.test(query)) {
        results.push({
          icon: 'fas fa-receipt',
          title: `Transaksi #${query}`,
          subtitle: 'Lihat detail transaksi',
          url: '/webtest/PointOfSale-Coffee-Shop/Laporan POS/coffee-pos.html'
        });
      }
    } catch (err) {
      console.error('[TopNavbar] Error searching categories:', err);
    }

    return results;
  }

  /**
   * Initialize notifications
   */
  function initializeNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (!notificationBtn || !notificationDropdown) return;

    notificationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle('active');
      
      // Close user menu if open
      const userDropdown = document.getElementById('userDropdown');
      if (userDropdown) {
        userDropdown.classList.remove('active');
      }
    });

    // Load initial notifications
    loadNotifications();

    // Poll for new notifications
    setInterval(loadNotifications, CONFIG.notificationCheckInterval);
  }

  /**
   * Load notifications
   */
  async function loadNotifications() {
    try {
      // Get notifications from API or generate mock data
      notifications = await getNotifications();

      const badge = document.getElementById('notificationBadge');
      const notificationList = document.getElementById('notificationList');

      if (!badge || !notificationList) return;

      const unreadCount = notifications.filter(n => !n.read).length;

      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }

      if (notifications.length === 0) {
        notificationList.innerHTML = `
          <div class="top-navbar-dropdown-empty">
            <i class="fas fa-bell-slash"></i>
            <p class="top-navbar-dropdown-empty-text">Tidak ada notifikasi baru</p>
          </div>
        `;
      } else {
        notificationList.innerHTML = notifications.map(n => `
          <div class="top-navbar-dropdown-item ${n.read ? '' : 'unread'}" data-notification-id="${n.id}">
            <div class="top-navbar-dropdown-item-icon ${n.type}">
              <i class="${n.icon}"></i>
            </div>
            <div class="top-navbar-dropdown-item-content">
              <div class="top-navbar-dropdown-item-title">${escapeHtml(n.title)}</div>
              <div class="top-navbar-dropdown-item-text">${escapeHtml(n.message)}</div>
              <div class="top-navbar-dropdown-item-time">${n.time}</div>
            </div>
          </div>
        `).join('');

        // Add click handlers
        notificationList.querySelectorAll('.top-navbar-dropdown-item').forEach(item => {
          item.addEventListener('click', () => {
            const notifId = item.dataset.notificationId;
            markNotificationAsRead(notifId);
            item.classList.remove('unread');
          });
        });
      }
    } catch (err) {
      console.error('[TopNavbar] Error loading notifications:', err);
    }
  }

  /**
   * Get notifications (mock for now)
   */
  async function getNotifications() {
    // TODO: Replace with actual API call
    return [
      {
        id: '1',
        title: 'Stok Rendah',
        message: 'Kopi Arabica tersisa 5 unit',
        time: '5 menit yang lalu',
        icon: 'fas fa-exclamation-triangle',
        type: 'warning',
        read: false
      },
      {
        id: '2',
        title: 'Transaksi Baru',
        message: 'Transaksi #1234 berhasil diselesaikan',
        time: '15 menit yang lalu',
        icon: 'fas fa-check-circle',
        type: 'success',
        read: true
      }
    ];
  }

  /**
   * Mark notification as read
   */
  function markNotificationAsRead(notificationId) {
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      loadNotifications();
    }
  }

  /**
   * Mark all notifications as read
   */
  function handleMarkAllRead(e) {
    e.preventDefault();
    notifications.forEach(n => n.read = true);
    loadNotifications();
  }

  /**
   * Initialize user menu
   */
  function initializeUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (!userMenuBtn || !userDropdown) return;

    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
      userMenuBtn.classList.toggle('active');
      
      // Close notification dropdown if open
      const notificationDropdown = document.getElementById('notificationDropdown');
      if (notificationDropdown) {
        notificationDropdown.classList.remove('active');
      }
    });
  }

  /**
   * Initialize mobile menu
   */
  function initializeMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (!menuToggle || !mobileMenu || !mobileOverlay) return;

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });

    mobileOverlay.addEventListener('click', () => {
      closeMobileMenu();
    });

    // Set active menu item based on current page
    setActiveMobileMenuItem();
  }

  /**
   * Toggle mobile menu
   */
  function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileMenu && mobileOverlay) {
      const isActive = mobileMenu.classList.contains('active');
      
      if (isActive) {
        closeMobileMenu();
      } else {
        mobileMenu.classList.add('active');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
  }

  /**
   * Close mobile menu
   */
  function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileMenu) mobileMenu.classList.remove('active');
    if (mobileOverlay) mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Set active mobile menu item
   */
  function setActiveMobileMenuItem() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.top-navbar-mobile-nav-item');
    
    menuItems.forEach(item => {
      const itemPath = new URL(item.href).pathname;
      if (currentPath.includes(itemPath)) {
        item.classList.add('active');
      }
    });
  }

  /**
   * Initialize breadcrumbs
   */
  function initializeBreadcrumbs() {
    // Breadcrumbs will be set dynamically by each page
    // This is a placeholder for future implementation
  }

  /**
   * Setup scroll behavior with auto-hide
   */
  function setupScrollBehavior() {
    let lastScroll = 0;
    let isScrolling = false;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      const navbar = document.querySelector('.top-navbar');
      
      if (!navbar) return;

      // Add scrolled class for shadow effect
      if (currentScroll > CONFIG.scrollThreshold) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      // Auto-hide logic
      if (currentScroll <= 0) {
        // At the top of page - always show
        navbar.classList.remove('hidden');
      } else if (currentScroll > lastScroll && currentScroll > CONFIG.scrollThreshold) {
        // Scrolling down & past threshold - hide navbar
        navbar.classList.add('hidden');
        
        // Close any open dropdowns when hiding
        closeAllDropdowns();
      } else if (currentScroll < lastScroll) {
        // Scrolling up - show navbar
        navbar.classList.remove('hidden');
      }

      lastScroll = currentScroll;
    });
  }

  /**
   * Close all dropdowns
   */
  function closeAllDropdowns() {
    const searchResults = document.getElementById('searchResults');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const userDropdown = document.getElementById('userDropdown');
    const userMenuBtn = document.getElementById('userMenuBtn');

    if (searchResults) searchResults.classList.remove('active');
    if (notificationDropdown) notificationDropdown.classList.remove('active');
    if (userDropdown) userDropdown.classList.remove('active');
    if (userMenuBtn) userMenuBtn.classList.remove('active');
  }

  /**
   * Handle clicks outside dropdowns
   */
  function handleOutsideClick(e) {
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('topNavbarSearch');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const userDropdown = document.getElementById('userDropdown');
    const userMenuBtn = document.getElementById('userMenuBtn');

    // Close search results
    if (searchResults && !searchInput?.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.remove('active');
    }

    // Close notification dropdown
    if (notificationDropdown && !notificationDropdown.contains(e.target)) {
      const notificationBtn = document.getElementById('notificationBtn');
      if (!notificationBtn?.contains(e.target)) {
        notificationDropdown.classList.remove('active');
      }
    }

    // Close user dropdown
    if (userDropdown && !userDropdown.contains(e.target) && !userMenuBtn?.contains(e.target)) {
      userDropdown.classList.remove('active');
      userMenuBtn?.classList.remove('active');
    }
  }

  /**
   * Handle logout
   */
  function handleLogout(e) {
    e.preventDefault();
    
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      // Clear session
      if (window.DigiCafAuth && typeof window.DigiCafAuth.logout === 'function') {
        window.DigiCafAuth.logout();
      } else {
        localStorage.removeItem('session');
      }
      
      // Redirect to login
      window.location.href = '/webtest/PointOfSale-Coffee-Shop/auth/login.html';
    }
  }

  /**
   * Utility: Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Utility: Format Rupiah
   */
  function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external use
  window.TopNavbar = {
    init,
    closeMobileMenu,
    toggleMobileMenu,
    loadNotifications
  };

})();
