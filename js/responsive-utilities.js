/**
 * Responsive Utilities
 * Coffee Shop POS System
 * JavaScript helpers for responsive behavior
 */

class ResponsiveHelper {
  /**
   * Breakpoints (sync with design-tokens.css)
   */
  static breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536
  };

  /**
   * Get current breakpoint
   * @returns {string} - 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'
   */
  static getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width >= this.breakpoints.xxl) return 'xxl';
    if (width >= this.breakpoints.xl) return 'xl';
    if (width >= this.breakpoints.lg) return 'lg';
    if (width >= this.breakpoints.md) return 'md';
    if (width >= this.breakpoints.sm) return 'sm';
    return 'xs';
  }

  /**
   * Check if mobile (below md breakpoint)
   * @returns {boolean}
   */
  static isMobile() {
    return window.innerWidth < this.breakpoints.md;
  }

  /**
   * Check if tablet (md to lg)
   * @returns {boolean}
   */
  static isTablet() {
    const width = window.innerWidth;
    return width >= this.breakpoints.md && width < this.breakpoints.lg;
  }

  /**
   * Check if desktop (lg and above)
   * @returns {boolean}
   */
  static isDesktop() {
    return window.innerWidth >= this.breakpoints.lg;
  }

  /**
   * Add breakpoint change listener
   * @param {Function} callback - Called when breakpoint changes
   * @returns {Function} - Cleanup function
   */
  static onBreakpointChange(callback) {
    let currentBreakpoint = this.getCurrentBreakpoint();
    
    const handler = () => {
      const newBreakpoint = this.getCurrentBreakpoint();
      if (newBreakpoint !== currentBreakpoint) {
        currentBreakpoint = newBreakpoint;
        callback(newBreakpoint);
      }
    };
    
    window.addEventListener('resize', handler);
    
    // Return cleanup function
    return () => window.removeEventListener('resize', handler);
  }

  /**
   * Debounce function
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  static debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

/**
 * Mobile Drawer Component
 */
class MobileDrawer {
  constructor(drawerId, options = {}) {
    this.drawer = document.getElementById(drawerId);
    this.overlay = null;
    this.isOpen = false;
    
    this.options = {
      overlayClass: 'mobile-drawer-overlay',
      openClass: 'open',
      visibleClass: 'visible',
      ...options
    };
    
    this.init();
  }
  
  init() {
    if (!this.drawer) return;
    
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = this.options.overlayClass;
    document.body.appendChild(this.overlay);
    
    // Overlay click closes drawer
    this.overlay.addEventListener('click', () => this.close());
    
    // Close button
    const closeBtn = this.drawer.querySelector('.mobile-drawer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }
  
  open() {
    this.drawer.classList.add(this.options.openClass);
    this.overlay.classList.add(this.options.visibleClass);
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
  }
  
  close() {
    this.drawer.classList.remove(this.options.openClass);
    this.overlay.classList.remove(this.options.visibleClass);
    document.body.style.overflow = '';
    this.isOpen = false;
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
}

/**
 * Mobile Navigation Toggle
 */
class MobileNav {
  constructor(toggleSelector, menuSelector) {
    this.toggle = document.querySelector(toggleSelector);
    this.menu = document.querySelector(menuSelector);
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    if (!this.toggle || !this.menu) return;
    
    this.toggle.addEventListener('click', () => this.toggleMenu());
    
    // Close when clicking outside (mobile only)
    document.addEventListener('click', (e) => {
      if (ResponsiveHelper.isMobile() && 
          this.isOpen && 
          !this.menu.contains(e.target) && 
          !this.toggle.contains(e.target)) {
        this.close();
      }
    });
  }
  
  open() {
    this.menu.classList.add('active');
    this.toggle.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
  }
  
  close() {
    this.menu.classList.remove('active');
    this.toggle.classList.remove('active');
    document.body.style.overflow = '';
    this.isOpen = false;
  }
  
  toggleMenu() {
    this.isOpen ? this.close() : this.open();
  }
}

/**
 * Responsive Table Handler
 */
class ResponsiveTable {
  constructor(tableSelector) {
    this.table = document.querySelector(tableSelector);
    if (!this.table) return;
    
    this.init();
  }
  
  init() {
    // Add data-label attributes for mobile view
    const headers = this.table.querySelectorAll('thead th');
    const rows = this.table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index].textContent.trim());
        }
      });
    });
    
    // Wrap table for horizontal scroll
    if (!this.table.parentElement.classList.contains('table-responsive-mobile')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive-mobile';
      this.table.parentNode.insertBefore(wrapper, this.table);
      wrapper.appendChild(this.table);
    }
  }
  
  /**
   * Make all tables responsive on page
   */
  static makeAllTablesResponsive() {
    const tables = document.querySelectorAll('table:not(.no-responsive)');
    tables.forEach(table => {
      new ResponsiveTable(`#${table.id || table.className}`);
    });
  }
}

/**
 * Responsive Modal
 */
class ResponsiveModal {
  constructor(modalId, options = {}) {
    this.modal = document.getElementById(modalId);
    this.isOpen = false;
    
    this.options = {
      fullscreenMobile: true,
      ...options
    };
    
    this.init();
  }
  
  init() {
    if (!this.modal) return;
    
    // Add responsive class
    if (this.options.fullscreenMobile) {
      this.modal.classList.add('modal-fullscreen-mobile');
    } else {
      this.modal.classList.add('modal-responsive');
    }
    
    // Close handlers
    const closeBtn = this.modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
    
    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  open() {
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
    
    // Focus trap for accessibility
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
  
  close() {
    this.modal.style.display = 'none';
    document.body.style.overflow = '';
    this.isOpen = false;
  }
}

/**
 * Tabs Handler (mobile scrollable)
 */
class ResponsiveTabs {
  constructor(tabsContainer) {
    this.container = typeof tabsContainer === 'string' 
      ? document.querySelector(tabsContainer) 
      : tabsContainer;
    
    if (!this.container) return;
    
    this.init();
  }
  
  init() {
    const tabs = this.container.querySelectorAll('.tab-mobile, .tab-tablet');
    const activeTab = this.container.querySelector('.tab-mobile.active, .tab-tablet.active');
    
    // Scroll active tab into view on mobile
    if (ResponsiveHelper.isMobile() && activeTab) {
      activeTab.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      });
    }
    
    // Tab click handler
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active from all
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active to clicked
        tab.classList.add('active');
        
        // Scroll into view on mobile
        if (ResponsiveHelper.isMobile()) {
          tab.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'center' 
          });
        }
        
        // Emit custom event
        const event = new CustomEvent('tabChange', { 
          detail: { 
            tabId: tab.getAttribute('data-tab-id'),
            tab: tab
          } 
        });
        this.container.dispatchEvent(event);
      });
    });
  }
}

/**
 * Accordion Component
 */
class Accordion {
  constructor(accordionSelector) {
    this.accordion = document.querySelector(accordionSelector);
    if (!this.accordion) return;
    
    this.init();
  }
  
  init() {
    const headers = this.accordion.querySelectorAll('.accordion-header');
    
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const isOpen = item.classList.contains('open');
        
        // Close all items
        this.accordion.querySelectorAll('.accordion-item').forEach(i => {
          i.classList.remove('open');
        });
        
        // Open clicked item if it was closed
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    });
  }
}

/**
 * Viewport Height Fix (for mobile browsers)
 */
class ViewportHeightFix {
  static init() {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', ResponsiveHelper.debounce(setVH, 100));
  }
}

/**
 * Touch Gesture Detector
 */
class TouchGestures {
  constructor(element) {
    this.element = element;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    
    this.init();
  }
  
  init() {
    this.element.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    this.element.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleGesture();
    }, false);
  }
  
  handleGesture() {
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;
    
    // Swipe threshold
    const threshold = 50;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.onSwipeRight();
        } else {
          this.onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0) {
          this.onSwipeDown();
        } else {
          this.onSwipeUp();
        }
      }
    }
  }
  
  onSwipeLeft() {
    this.element.dispatchEvent(new CustomEvent('swipeleft'));
  }
  
  onSwipeRight() {
    this.element.dispatchEvent(new CustomEvent('swiperight'));
  }
  
  onSwipeUp() {
    this.element.dispatchEvent(new CustomEvent('swipeup'));
  }
  
  onSwipeDown() {
    this.element.dispatchEvent(new CustomEvent('swipedown'));
  }
}

/**
 * Initialize responsive utilities
 */
function initResponsive() {
  // Fix viewport height
  ViewportHeightFix.init();
  
  // Make all tables responsive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ResponsiveTable.makeAllTablesResponsive();
    });
  } else {
    ResponsiveTable.makeAllTablesResponsive();
  }
  
  // Add body class for current breakpoint
  const updateBodyClass = (breakpoint) => {
    document.body.className = document.body.className
      .replace(/breakpoint-\w+/g, '');
    document.body.classList.add(`breakpoint-${breakpoint}`);
  };
  
  updateBodyClass(ResponsiveHelper.getCurrentBreakpoint());
  ResponsiveHelper.onBreakpointChange(updateBodyClass);
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResponsive);
} else {
  initResponsive();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ResponsiveHelper,
    MobileDrawer,
    MobileNav,
    ResponsiveTable,
    ResponsiveModal,
    ResponsiveTabs,
    Accordion,
    ViewportHeightFix,
    TouchGestures
  };
}
