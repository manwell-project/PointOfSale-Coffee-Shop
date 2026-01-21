/**
 * Skeleton Loader & Loading Helpers
 * Coffee Shop POS System
 * JavaScript utilities for loading states
 */

/**
 * SkeletonLoader Class
 * Generate skeleton loaders dynamically
 */
class SkeletonLoader {
  /**
   * Create skeleton stat cards
   * @param {HTMLElement} container - Container element
   * @param {number} count - Number of skeleton cards
   */
  static createStatCards(container, count = 4) {
    if (!container) return;
    
    const html = Array.from({ length: count }, () => `
      <div class="skeleton-stat-card">
        <div class="skeleton skeleton-stat-icon"></div>
        <div class="skeleton skeleton-stat-label"></div>
        <div class="skeleton skeleton-stat-value"></div>
      </div>
    `).join('');
    
    container.innerHTML = html;
  }

  /**
   * Create skeleton product cards
   * @param {HTMLElement} container - Container element
   * @param {number} count - Number of skeleton cards
   */
  static createProductCards(container, count = 6) {
    if (!container) return;
    
    const html = Array.from({ length: count }, () => `
      <div class="skeleton-product-card">
        <div class="skeleton skeleton-product-image"></div>
        <div class="skeleton skeleton-product-title"></div>
        <div class="skeleton skeleton-product-price"></div>
      </div>
    `).join('');
    
    container.innerHTML = html;
  }

  /**
   * Create skeleton table rows
   * @param {HTMLElement} container - Container element
   * @param {number} count - Number of skeleton rows
   */
  static createTableRows(container, count = 5) {
    if (!container) return;
    
    const html = Array.from({ length: count }, () => `
      <div class="skeleton-table-row">
        <div class="skeleton skeleton-table-cell"></div>
        <div class="skeleton skeleton-table-cell"></div>
        <div class="skeleton skeleton-table-cell"></div>
        <div class="skeleton skeleton-table-cell"></div>
      </div>
    `).join('');
    
    container.innerHTML = html;
  }

  /**
   * Create skeleton list items
   * @param {HTMLElement} container - Container element
   * @param {number} count - Number of skeleton items
   */
  static createListItems(container, count = 5) {
    if (!container) return;
    
    const html = Array.from({ length: count }, () => `
      <div class="skeleton-list-item">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-list-item-content">
          <div class="skeleton skeleton-text" style="width: 70%;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 50%;"></div>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = html;
  }

  /**
   * Generic skeleton generator
   * @param {string} type - Type of skeleton (text, avatar, card, etc)
   * @param {object} options - Additional options
   */
  static create(type = 'text', options = {}) {
    const { width = '100%', height, className = '' } = options;
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton ${className}`;
    
    switch(type) {
      case 'text':
        skeleton.classList.add('skeleton-text');
        break;
      case 'avatar':
        skeleton.classList.add('skeleton-avatar');
        break;
      case 'button':
        skeleton.classList.add('skeleton-button');
        break;
      case 'card':
        skeleton.classList.add('skeleton-card');
        break;
    }
    
    skeleton.style.width = width;
    if (height) skeleton.style.height = height;
    
    return skeleton;
  }
}

/**
 * LoadingOverlay Class
 * Full screen loading overlay
 */
class LoadingOverlay {
  constructor() {
    this.overlay = null;
  }

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   * @param {string} submessage - Sub message (optional)
   */
  show(message = 'Memuat...', submessage = '') {
    // Remove existing overlay if any
    this.hide();
    
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'loading-overlay active';
    this.overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner-xl spinner-primary"></div>
        <div class="loading-message">${message}</div>
        ${submessage ? `<div class="loading-submessage">${submessage}</div>` : ''}
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide loading overlay
   */
  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        document.body.style.overflow = '';
      }, 300);
    }
  }

  /**
   * Update message
   * @param {string} message - New message
   * @param {string} submessage - New sub message
   */
  updateMessage(message, submessage = '') {
    if (this.overlay) {
      const messageEl = this.overlay.querySelector('.loading-message');
      const submessageEl = this.overlay.querySelector('.loading-submessage');
      
      if (messageEl) messageEl.textContent = message;
      
      if (submessage) {
        if (submessageEl) {
          submessageEl.textContent = submessage;
        } else {
          const newSubmsg = document.createElement('div');
          newSubmsg.className = 'loading-submessage';
          newSubmsg.textContent = submessage;
          this.overlay.querySelector('.loading-content').appendChild(newSubmsg);
        }
      }
    }
  }
}

/**
 * ButtonLoader Class
 * Handle button loading states
 */
class ButtonLoader {
  /**
   * Set button to loading state
   * @param {HTMLElement} button - Button element
   * @param {string} loadingText - Text to show while loading
   */
  static start(button, loadingText = null) {
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    
    if (loadingText) {
      button.innerHTML = `
        <span class="spinner spinner-white spinner-sm"></span>
        <span>${loadingText}</span>
      `;
    } else {
      button.classList.add('loading');
    }
  }

  /**
   * Remove loading state from button
   * @param {HTMLElement} button - Button element
   */
  static stop(button) {
    if (!button) return;
    
    button.disabled = false;
    button.classList.remove('loading');
    
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

/**
 * ProgressBar Class
 * Animated progress bar
 */
class ProgressBar {
  constructor(element, options = {}) {
    this.element = typeof element === 'string' 
      ? document.querySelector(element) 
      : element;
    
    this.options = {
      striped: false,
      animated: false,
      showLabel: false,
      ...options
    };
    
    this.value = 0;
    this.init();
  }

  init() {
    if (!this.element) return;
    
    this.element.classList.add('progress-bar');
    
    if (this.options.striped) {
      this.element.classList.add('progress-bar-striped');
    }
    
    if (this.options.animated) {
      this.element.classList.add('progress-bar-animated');
    }
    
    this.fill = document.createElement('div');
    this.fill.className = 'progress-fill';
    this.element.appendChild(this.fill);
    
    if (this.options.showLabel) {
      this.label = document.createElement('div');
      this.label.className = 'progress-label';
      this.element.parentElement.insertBefore(this.label, this.element);
    }
  }

  /**
   * Set progress value
   * @param {number} value - Progress value (0-100)
   */
  setValue(value) {
    this.value = Math.min(100, Math.max(0, value));
    this.fill.style.width = `${this.value}%`;
    
    if (this.label) {
      this.label.textContent = `${Math.round(this.value)}%`;
    }
  }

  /**
   * Increment progress
   * @param {number} amount - Amount to increment
   */
  increment(amount = 1) {
    this.setValue(this.value + amount);
  }

  /**
   * Complete progress
   */
  complete() {
    this.setValue(100);
  }

  /**
   * Reset progress
   */
  reset() {
    this.setValue(0);
  }
}

/**
 * LoadingStates Helper
 * Centralized loading state management
 */
const LoadingStates = {
  overlay: new LoadingOverlay(),

  /**
   * Show page loading
   */
  showPageLoad(message = 'Memuat halaman...') {
    this.overlay.show(message);
  },

  /**
   * Hide page loading
   */
  hidePageLoad() {
    this.overlay.hide();
  },

  /**
   * Show element loading
   * @param {HTMLElement} element - Element to add loading state
   */
  showElementLoad(element) {
    if (!element) return;
    element.classList.add('is-loading');
  },

  /**
   * Hide element loading
   * @param {HTMLElement} element - Element to remove loading state
   */
  hideElementLoad(element) {
    if (!element) return;
    element.classList.remove('is-loading');
  },

  /**
   * Async wrapper with loading
   * @param {Function} asyncFn - Async function to execute
   * @param {string} message - Loading message
   */
  async withLoading(asyncFn, message = 'Memproses...') {
    this.overlay.show(message);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      this.overlay.hide();
    }
  },

  /**
   * Async button action with loading
   * @param {HTMLElement} button - Button element
   * @param {Function} asyncFn - Async function to execute
   * @param {string} loadingText - Loading text for button
   */
  async withButtonLoading(button, asyncFn, loadingText = null) {
    ButtonLoader.start(button, loadingText);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      ButtonLoader.stop(button);
    }
  }
};

/**
 * Global export
 */
if (typeof window !== 'undefined') {
  window.SkeletonLoader = SkeletonLoader;
  window.LoadingOverlay = LoadingOverlay;
  window.ButtonLoader = ButtonLoader;
  window.ProgressBar = ProgressBar;
  window.LoadingStates = LoadingStates;
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('✨ Loading States utilities initialized');
});
