/**
 * DigiCaf API Helper
 * Centralized API functions untuk semua modul
 */

const API_BASE = (window.DIGICAF_API_BASE || 'http://localhost:3000/api').replace(/\/$/, '');

// Generic API fetch helper
async function apiFetch(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.status === 204 ? null : await response.json();
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
}

// ============ PRODUCTS ============
const ProductsAPI = {
  getAll: () => apiFetch('/products'),
  getById: (id) => apiFetch(`/products/${id}`),
  getByCategory: (category) => apiFetch(`/products/category/${category}`),
  create: (data) => apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/products/${id}`, { method: 'DELETE' })
};

// ============ STOCKS ============
const StocksAPI = {
  getAll: () => apiFetch('/stocks'),
  getById: (id) => apiFetch(`/stocks/${id}`),
  getLowStock: () => apiFetch('/stocks/low-stock/list'),
  update: (id, data) => apiFetch(`/stocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  create: (data) => apiFetch('/stocks', { method: 'POST', body: JSON.stringify(data) }),
  getHistory: (productId) => apiFetch(`/stocks/product/${productId}/history`)
};

// ============ EMPLOYEES ============
const EmployeesAPI = {
  getAll: () => apiFetch('/employees'),
  getById: (id) => apiFetch(`/employees/${id}`),
  getByShift: (shift) => apiFetch(`/employees/shift/${shift}`),
  create: (data) => apiFetch('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/employees/${id}`, { method: 'DELETE' })
};

// ============ CUSTOMERS ============
const CustomersAPI = {
  getAll: () => apiFetch('/customers'),
  getById: (id) => apiFetch(`/customers/${id}`),
  getByPhone: (phone) => apiFetch(`/customers/phone/${phone}`),
  create: (data) => apiFetch('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/customers/${id}`, { method: 'DELETE' })
};

// ============ TRANSACTIONS ============
const TransactionsAPI = {
  getAll: () => apiFetch('/transactions'),
  getById: (id) => apiFetch(`/transactions/${id}`),
  create: (data) => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  getByDate: (date) => apiFetch(`/transactions/date/${date}`),
  getDailySummary: () => apiFetch('/transactions/summary/daily'),
  getRecent: (limit = 5) => apiFetch(`/transactions?limit=${limit}&sort=desc`)
};

// ============ REPORTS ============
const ReportsAPI = {
  getDaily: () => apiFetch('/reports/daily'),
  getMonthly: (year, month) => apiFetch(`/reports/monthly?year=${year}&month=${month}`),
  getBestsellers: (limit = 10) => apiFetch(`/reports/products/bestsellers?limit=${limit}`),
  getEmployeeSales: () => apiFetch('/reports/employees/sales'),
  getStockSummary: () => apiFetch('/reports/stocks/summary')
};

// Expose globally
window.API = {
  Products: ProductsAPI,
  Stocks: StocksAPI,
  Employees: EmployeesAPI,
  Customers: CustomersAPI,
  Transactions: TransactionsAPI,
  Reports: ReportsAPI,
  apiFetch
};

// Format currency untuk IDR
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Format date
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

console.log('✅ API Helper loaded - Access APIs with window.API');
