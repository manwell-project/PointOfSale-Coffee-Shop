/**
 * DigiCaf - Enhanced UX Utilities
 * Utility functions untuk meningkatkan user experience
 */

// ========================================
// Toast Notification System
// ========================================
const Toast = {
    show: function(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast') || this.createToast();
        
        // Set message and style
        toast.textContent = message;
        toast.className = 'toast show';
        
        // Add type-specific class
        if (type === 'success') toast.style.background = 'rgba(40, 167, 69, 0.9)';
        else if (type === 'error') toast.style.background = 'rgba(220, 53, 69, 0.9)';
        else if (type === 'warning') toast.style.background = 'rgba(255, 193, 7, 0.9)';
        else toast.style.background = 'rgba(0, 0, 0, 0.85)';
        
        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },
    
    createToast: function() {
        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
        return toast;
    }
};

// ========================================
// Loading Spinner
// ========================================
const Loading = {
    show: function(message = 'Memuat...') {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: white; margin-bottom: 16px;"></i>
                <div style="color: white; font-size: 16px;">${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    },
    
    hide: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.remove();
    }
};

// ========================================
// Confirm Dialog
// ========================================
const Confirm = {
    show: function(message, onConfirm, onCancel) {
        return new Promise((resolve) => {
            const result = confirm(message);
            if (result && onConfirm) onConfirm();
            if (!result && onCancel) onCancel();
            resolve(result);
        });
    }
};

// ========================================
// Local Storage Helper
// ========================================
const Storage = {
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
};

// ========================================
// Format Utilities
// ========================================
const Format = {
    currency: function(amount) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    },
    
    date: function(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString('id-ID');
        } else if (format === 'long') {
            return d.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        return d.toISOString();
    },
    
    time: function(date) {
        const d = new Date(date);
        return d.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },
    
    phone: function(phone) {
        // Format: +62 812-3456-7890
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('62')) {
            return `+62 ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
        }
        return phone;
    }
};

// ========================================
// Validation Utilities
// ========================================
const Validate = {
    email: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    phone: function(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 13;
    },
    
    required: function(value) {
        return value !== null && value !== undefined && value.trim() !== '';
    },
    
    number: function(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    minLength: function(value, min) {
        return value.length >= min;
    },
    
    maxLength: function(value, max) {
        return value.length <= max;
    }
};

// ========================================
// Debounce Function (untuk search)
// ========================================
function debounce(func, wait = 300) {
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

// ========================================
// Copy to Clipboard
// ========================================
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        Toast.show('Berhasil disalin!', 'success');
        return true;
    } catch (err) {
        Toast.show('Gagal menyalin', 'error');
        return false;
    }
}

// ========================================
// Print Function
// ========================================
function printElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        Toast.show('Element tidak ditemukan', 'error');
        return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print</title>');
    printWindow.document.write('<style>body{font-family:Arial;padding:20px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(element.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// ========================================
// Form Validation Helper
// ========================================
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const errors = [];
    
    for (const [fieldId, fieldRules] of Object.entries(rules)) {
        const field = document.getElementById(fieldId);
        if (!field) continue;
        
        const value = field.value.trim();
        
        if (fieldRules.required && !Validate.required(value)) {
            errors.push(`${fieldRules.label || fieldId} harus diisi`);
            isValid = false;
        }
        
        if (fieldRules.email && value && !Validate.email(value)) {
            errors.push(`${fieldRules.label || fieldId} tidak valid`);
            isValid = false;
        }
        
        if (fieldRules.phone && value && !Validate.phone(value)) {
            errors.push(`${fieldRules.label || fieldId} tidak valid`);
            isValid = false;
        }
        
        if (fieldRules.minLength && !Validate.minLength(value, fieldRules.minLength)) {
            errors.push(`${fieldRules.label || fieldId} minimal ${fieldRules.minLength} karakter`);
            isValid = false;
        }
    }
    
    if (!isValid) {
        Toast.show(errors[0], 'error');
    }
    
    return isValid;
}

// ========================================
// Auto-save Draft
// ========================================
class AutoSave {
    constructor(key, interval = 5000) {
        this.key = key;
        this.interval = interval;
        this.timer = null;
    }
    
    start(getData) {
        this.timer = setInterval(() => {
            const data = getData();
            Storage.set(`draft_${this.key}`, data);
        }, this.interval);
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    load() {
        return Storage.get(`draft_${this.key}`);
    }
    
    clear() {
        Storage.remove(`draft_${this.key}`);
    }
}

// ========================================
// Keyboard Shortcuts
// ========================================
const Shortcuts = {
    register: function(key, callback, ctrl = false, alt = false) {
        document.addEventListener('keydown', (e) => {
            if (e.key === key && e.ctrlKey === ctrl && e.altKey === alt) {
                e.preventDefault();
                callback();
            }
        });
    }
};

// ========================================
// Export untuk global use
// ========================================
window.DigiCaf = {
    Toast,
    Loading,
    Confirm,
    Storage,
    Format,
    Validate,
    debounce,
    copyToClipboard,
    printElement,
    validateForm,
    AutoSave,
    Shortcuts
};

// ========================================
// Auto-initialize
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple effect to buttons
    document.querySelectorAll('button, .btn').forEach(btn => {
        if (!btn.classList.contains('no-ripple')) {
            btn.classList.add('ripple');
        }
    });
    
    // Auto-format phone inputs
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value) {
                this.value = Format.phone(this.value);
            }
        });
    });
    
    // Add tooltips (if title attribute exists)
    document.querySelectorAll('[title]').forEach(el => {
        el.style.cursor = 'help';
    });
});

console.log('✨ DigiCaf UX Utilities loaded');
