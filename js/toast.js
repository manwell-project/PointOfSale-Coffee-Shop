/**
 * Toast & Alert Helper
 * Coffee Shop POS System
 * 
 * Usage Examples:
 * 
 * // Simple toast
 * showToast('Product added to cart');
 * 
 * // Toast with type
 * showToast('Stock updated successfully', 'success');
 * showToast('Failed to save data', 'error');
 * showToast('Please review your input', 'warning');
 * showToast('You have new notifications', 'info');
 * 
 * // Toast with title and actions
 * showToast('Order completed', 'success', {
 *   title: 'Success!',
 *   duration: 5000,
 *   position: 'bottom-right',
 *   actions: [
 *     { text: 'View Receipt', onClick: () => openReceipt() },
 *     { text: 'New Order', onClick: () => newOrder() }
 *   ]
 * });
 * 
 * // Loading toast
 * const loadingId = showLoadingToast('Processing payment...');
 * // Later: dismissToast(loadingId);
 * 
 * // Inline alert
 * showAlert('Please fill all required fields', 'warning', 'formContainer');
 */

class ToastManager {
  constructor() {
    this.toasts = new Map();
    this.toastId = 0;
    this.containers = new Map();
    this.initializeContainers();
  }

  /**
   * Initialize toast containers for different positions
   */
  initializeContainers() {
    const positions = ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center'];
    
    positions.forEach(position => {
      if (!document.getElementById(`toast-container-${position}`)) {
        const container = document.createElement('div');
        container.id = `toast-container-${position}`;
        container.className = `toast-container ${position}`;
        document.body.appendChild(container);
        this.containers.set(position, container);
      }
    });
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type: success, error, warning, info, loading
   * @param {object} options - Additional options
   */
  show(message, type = 'info', options = {}) {
    const {
      title = '',
      duration = 4000,
      position = 'bottom-right',
      closable = true,
      progress = true,
      actions = [],
      avatar = null,
      compact = false,
      onClose = null
    } = options;

    const id = ++this.toastId;
    const container = this.containers.get(position) || this.containers.get('bottom-right');

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    if (compact) toast.classList.add('toast-compact');
    toast.dataset.toastId = id;

    // Build toast HTML
    let html = '';

    // Avatar or Icon
    if (avatar) {
      html += `<img src="${avatar}" alt="Avatar" class="toast-avatar">`;
    } else {
      html += `<div class="toast-icon">`;
      switch (type) {
        case 'success':
          html += '<i class="fas fa-check-circle"></i>';
          break;
        case 'error':
        case 'danger':
          html += '<i class="fas fa-times-circle"></i>';
          break;
        case 'warning':
          html += '<i class="fas fa-exclamation-triangle"></i>';
          break;
        case 'loading':
          html += '<i class="fas fa-spinner"></i>';
          break;
        case 'info':
        default:
          html += '<i class="fas fa-info-circle"></i>';
          break;
      }
      html += '</div>';
    }

    // Content
    html += '<div class="toast-content">';
    if (title) {
      html += `<div class="toast-title">${this.escapeHtml(title)}</div>`;
    }
    html += `<div class="toast-message">${this.escapeHtml(message)}</div>`;

    // Actions
    if (actions.length > 0) {
      html += '<div class="toast-actions">';
      actions.forEach((action, index) => {
        const btnClass = action.primary ? 'toast-action primary' : 'toast-action';
        html += `<button class="${btnClass}" data-action-index="${index}">${this.escapeHtml(action.text)}</button>`;
      });
      html += '</div>';
    }

    html += '</div>';

    // Close button
    if (closable) {
      html += '<button class="toast-close" aria-label="Close"><i class="fas fa-times"></i></button>';
    }

    toast.innerHTML = html;

    // Progress bar
    if (progress && type !== 'loading' && duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.className = 'toast-progress';
      progressBar.style.animationDuration = `${duration}ms`;
      toast.appendChild(progressBar);
    }

    // Append to container
    container.appendChild(toast);

    // Event listeners
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.dismiss(id));
    }

    // Action buttons
    if (actions.length > 0) {
      const actionBtns = toast.querySelectorAll('.toast-action');
      actionBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
          if (actions[index].onClick) {
            actions[index].onClick();
          }
          if (actions[index].dismiss !== false) {
            this.dismiss(id);
          }
        });
      });
    }

    // Auto dismiss
    if (duration > 0 && type !== 'loading') {
      setTimeout(() => this.dismiss(id), duration);
    }

    // Store toast reference
    this.toasts.set(id, {
      element: toast,
      container,
      onClose
    });

    return id;
  }

  /**
   * Dismiss a toast
   * @param {number} id - Toast ID
   */
  dismiss(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.element.classList.add('toast-exit');
    
    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      
      if (toast.onClose) {
        toast.onClose();
      }
      
      this.toasts.delete(id);
    }, 300); // Match animation duration
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    this.toasts.forEach((_, id) => this.dismiss(id));
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global toast manager instance
const toastManager = new ToastManager();

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info, loading)
 * @param {object} options - Additional options
 * @returns {number} Toast ID
 */
function showToast(message, type = 'info', options = {}) {
  return toastManager.show(message, type, options);
}

/**
 * Show success toast
 */
function showSuccessToast(message, options = {}) {
  return showToast(message, 'success', options);
}

/**
 * Show error toast
 */
function showErrorToast(message, options = {}) {
  return showToast(message, 'error', options);
}

/**
 * Show warning toast
 */
function showWarningToast(message, options = {}) {
  return showToast(message, 'warning', options);
}

/**
 * Show info toast
 */
function showInfoToast(message, options = {}) {
  return showToast(message, 'info', options);
}

/**
 * Show loading toast
 */
function showLoadingToast(message, options = {}) {
  return showToast(message, 'loading', { duration: 0, closable: false, progress: false, ...options });
}

/**
 * Dismiss a toast
 * @param {number} id - Toast ID
 */
function dismissToast(id) {
  toastManager.dismiss(id);
}

/**
 * Dismiss all toasts
 */
function dismissAllToasts() {
  toastManager.dismissAll();
}

/**
 * Show an inline alert
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, warning, info)
 * @param {string} containerId - Container element ID or element
 * @param {object} options - Additional options
 */
function showAlert(message, type = 'info', containerId, options = {}) {
  const {
    title = '',
    closable = true,
    borderLeft = false,
    solid = false,
    position = 'prepend' // 'prepend' or 'append'
  } = options;

  const container = typeof containerId === 'string' 
    ? document.getElementById(containerId) 
    : containerId;

  if (!container) {
    console.error('Alert container not found:', containerId);
    return null;
  }

  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  if (closable) alert.classList.add('alert-dismissible');
  if (borderLeft) alert.classList.add('alert-border-left');
  if (solid) alert.classList.add('alert-solid');

  // Build alert HTML
  let html = '';

  // Icon
  html += '<div class="alert-icon">';
  switch (type) {
    case 'success':
      html += '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
    case 'danger':
      html += '<i class="fas fa-times-circle"></i>';
      break;
    case 'warning':
      html += '<i class="fas fa-exclamation-triangle"></i>';
      break;
    case 'info':
    default:
      html += '<i class="fas fa-info-circle"></i>';
      break;
  }
  html += '</div>';

  // Content
  html += '<div class="alert-content">';
  if (title) {
    html += `<div class="alert-title">${toastManager.escapeHtml(title)}</div>`;
  }
  html += `<div class="alert-message">${toastManager.escapeHtml(message)}</div>`;
  html += '</div>';

  // Close button
  if (closable) {
    html += '<button class="alert-close" aria-label="Close"><i class="fas fa-times"></i></button>';
  }

  alert.innerHTML = html;

  // Insert into container
  if (position === 'prepend') {
    container.insertBefore(alert, container.firstChild);
  } else {
    container.appendChild(alert);
  }

  // Close button handler
  if (closable) {
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      }, 300);
    });
  }

  return alert;
}

/**
 * Remove all alerts from a container
 * @param {string} containerId - Container element ID or element
 */
function clearAlerts(containerId) {
  const container = typeof containerId === 'string' 
    ? document.getElementById(containerId) 
    : containerId;

  if (!container) return;

  const alerts = container.querySelectorAll('.alert');
  alerts.forEach(alert => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  });
}

// Export functions for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    showLoadingToast,
    dismissToast,
    dismissAllToasts,
    showAlert,
    clearAlerts
  };
}
