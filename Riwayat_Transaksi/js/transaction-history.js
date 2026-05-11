/**
 * Transaction History Management JavaScript
 * DigiCaf - Transaction History Module
 * 
 * Handles transaction list display, filtering, search, and details
 */

// ============================================
// DOM REFERENCES
// ============================================

const filterToggleBtn = document.getElementById('filterToggleBtn');
const filterPanel = document.getElementById('filterPanel');
const filterFromDate = document.getElementById('filterFromDate');
const filterToDate = document.getElementById('filterToDate');
const filterPayment = document.getElementById('filterPayment');
const filterStatus = document.getElementById('filterStatus');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const applyFilterBtn = document.getElementById('applyFilterBtn');

const searchInput = document.getElementById('searchInput');
const resultsCount = document.getElementById('resultsCount');

const tableLoading = document.getElementById('tableLoading');
const tableWrapper = document.getElementById('tableWrapper');
const emptyState = document.getElementById('emptyState');
const transactionsTableBody = document.getElementById('transactionsTableBody');
const pagination = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');

const totalTransactionsEl = document.getElementById('totalTransactions');
const totalRevenueEl = document.getElementById('totalRevenue');
const avgTransactionEl = document.getElementById('avgTransaction');
const completedCountEl = document.getElementById('completedCount');

const detailModal = document.getElementById('detailModal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const printReceiptBtn = document.getElementById('printReceiptBtn');

const exportBtn = document.getElementById('exportBtn');

// ============================================
// STATE MANAGEMENT
// ============================================

let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentTransactionDetail = null;

// Filter state
let filters = {
  fromDate: null,
  toDate: null,
  paymentMethod: '',
  status: ''
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadTransactions();
  setupEventListeners();
  setTodayAsDefault();
});

function setTodayAsDefault() {
  const today = new Date().toISOString().split('T')[0];
  // Set default date range to last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  filterFromDate.value = thirtyDaysAgo.toISOString().split('T')[0];
  filterToDate.value = today;
}

function setupEventListeners() {
  // Filter events
  filterToggleBtn.addEventListener('click', toggleFilterPanel);
  applyFilterBtn.addEventListener('click', applyFilters);
  resetFilterBtn.addEventListener('click', resetFilters);

  // Search event
  searchInput.addEventListener('input', handleSearch);

  // Pagination events
  prevPageBtn.addEventListener('click', previousPage);
  nextPageBtn.addEventListener('click', nextPage);

  // Modal events
  closeModalBtn.addEventListener('click', closeModal);
  closeDetailBtn.addEventListener('click', closeModal);
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });
  printReceiptBtn.addEventListener('click', printReceipt);

  // Export event
  exportBtn.addEventListener('click', exportTransactions);
}

// ============================================
// DATA LOADING
// ============================================

async function loadTransactions() {
  try {
    showLoading();
    const response = await fetch('/api/transactions');
    
    if (!response.ok) {
      throw new Error('Failed to load transactions');
    }

    allTransactions = await response.json();
    filteredTransactions = [...allTransactions];
    
    updateSummary();
    displayTransactions();
    hideLoading();
  } catch (error) {
    console.error('Error loading transactions:', error);
    showError('Gagal memuat data transaksi');
    hideLoading();
  }
}

// ============================================
// FILTER & SEARCH
// ============================================

function toggleFilterPanel() {
  if (filterPanel.style.display === 'none') {
    filterPanel.style.display = 'block';
  } else {
    filterPanel.style.display = 'none';
  }
}

function applyFilters() {
  filters = {
    fromDate: filterFromDate.value ? new Date(filterFromDate.value) : null,
    toDate: filterToDate.value ? new Date(filterToDate.value) : null,
    paymentMethod: filterPayment.value,
    status: filterStatus.value
  };

  // Apply filters
  filteredTransactions = allTransactions.filter(transaction => {
    const transDate = new Date(transaction.created_at || transaction.transaction_date);
    
    // Date range filter
    if (filters.fromDate && transDate < filters.fromDate) return false;
    if (filters.toDate) {
      const endOfDay = new Date(filters.toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (transDate > endOfDay) return false;
    }

    // Payment method filter
    if (filters.paymentMethod && transaction.payment_method !== filters.paymentMethod) {
      return false;
    }

    // Status filter
    if (filters.status && transaction.status !== filters.status) {
      return false;
    }

    return true;
  });

  currentPage = 1;
  displayTransactions();
  filterPanel.style.display = 'none';
}

function resetFilters() {
  filters = {
    fromDate: null,
    toDate: null,
    paymentMethod: '',
    status: ''
  };
  filterFromDate.value = '';
  filterToDate.value = '';
  filterPayment.value = '';
  filterStatus.value = '';
  
  filteredTransactions = [...allTransactions];
  currentPage = 1;
  displayTransactions();
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  
  if (searchTerm === '') {
    applyFilters();
    return;
  }

  filteredTransactions = allTransactions.filter(transaction => {
    const id = String(transaction.id).toLowerCase();
    const customerName = (transaction.customer_name || '').toLowerCase();
    const employeeName = (transaction.employee_name || '').toLowerCase();
    
    return id.includes(searchTerm) || 
           customerName.includes(searchTerm) || 
           employeeName.includes(searchTerm);
  });

  currentPage = 1;
  displayTransactions();
}

// ============================================
// DISPLAY & RENDERING
// ============================================

function displayTransactions() {
  updateResultsCount();

  if (filteredTransactions.length === 0) {
    showEmptyState();
    updateSummary();
    return;
  }

  renderTable();
  updateSummary();
  updatePagination();
  tableWrapper.style.display = 'block';
  emptyState.style.display = 'none';
}

function renderTable() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageTransactions = filteredTransactions.slice(startIndex, endIndex);

  transactionsTableBody.innerHTML = pageTransactions.map(transaction => `
    <tr onclick="viewTransactionDetail(${transaction.id})">
      <td class="transaction-id">#${String(transaction.id).padStart(5, '0')}</td>
      <td class="transaction-date">
        ${formatDateTime(transaction.created_at || transaction.transaction_date)}
      </td>
      <td class="transaction-customer">
        ${transaction.customer_name || 'Walk-in Customer'}
      </td>
      <td class="transaction-employee">
        ${transaction.employee_name || '-'}
      </td>
      <td class="transaction-amount">
        ${formatCurrency(transaction.total_amount)}
      </td>
      <td>
        <span class="payment-badge">
          ${formatPaymentMethod(transaction.payment_method)}
        </span>
      </td>
      <td>
        <span class="status-badge ${transaction.status || 'completed'}">
          ${formatStatus(transaction.status || 'completed')}
        </span>
      </td>
      <td class="table-actions">
        <button class="btn-action" onclick="event.stopPropagation(); viewTransactionDetail(${transaction.id})" title="Lihat Detail">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-action" onclick="event.stopPropagation(); printReceipt(${transaction.id})" title="Print Receipt">
          <i class="fas fa-print"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function updateResultsCount() {
  const count = filteredTransactions.length;
  resultsCount.textContent = `${count} transaksi`;
}

function showEmptyState() {
  tableWrapper.style.display = 'none';
  emptyState.style.display = 'flex';
  pagination.style.display = 'none';
}

function showLoading() {
  tableLoading.style.display = 'flex';
  tableWrapper.style.display = 'none';
  emptyState.style.display = 'none';
  pagination.style.display = 'none';
}

function hideLoading() {
  tableLoading.style.display = 'none';
}

// ============================================
// SUMMARY STATISTICS
// ============================================

function updateSummary() {
  const transactions = filteredTransactions;

  // Total transactions
  totalTransactionsEl.textContent = transactions.length;

  // Total revenue
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  totalRevenueEl.textContent = formatCurrency(totalRevenue);

  // Average transaction
  const avgTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;
  avgTransactionEl.textContent = formatCurrency(avgTransaction);

  // Completed transactions
  const completed = transactions.filter(t => (t.status || 'completed') === 'completed').length;
  completedCountEl.textContent = completed;
}

// ============================================
// PAGINATION
// ============================================

function updatePagination() {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  
  if (totalPages > 1) {
    pagination.style.display = 'flex';
    pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  } else {
    pagination.style.display = 'none';
  }
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
    updatePagination();
    window.scrollTo(0, 0);
  }
}

function nextPage() {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
    updatePagination();
    window.scrollTo(0, 0);
  }
}

// ============================================
// TRANSACTION DETAILS
// ============================================

async function viewTransactionDetail(transactionId) {
  try {
    const response = await fetch(`/api/transactions/${transactionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load transaction details');
    }

    currentTransactionDetail = await response.json();
    displayTransactionDetail();
    detailModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error loading transaction details:', error);
    showError('Gagal memuat detail transaksi');
  }
}

function displayTransactionDetail() {
  const t = currentTransactionDetail;
  const items = t.items || [];

  let itemsHTML = '';
  if (items.length > 0) {
    itemsHTML = `
      <h3 style="margin-bottom: var(--spacing-md);">Barang-Barang Terjual</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Produk</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Harga</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.product_name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
              <td style="text-align: right;">${formatCurrency(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  modalBody.innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <div class="detail-label">ID Transaksi</div>
        <div class="detail-value">#${String(t.id).padStart(5, '0')}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Tanggal & Waktu</div>
        <div class="detail-value">${formatDateTime(t.created_at || t.transaction_date)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Customer</div>
        <div class="detail-value">${t.customer_name || 'Walk-in'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Karyawan</div>
        <div class="detail-value">${t.employee_name || '-'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Pembayaran</div>
        <div class="detail-value">${formatPaymentMethod(t.payment_method)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Status</div>
        <div class="detail-value">
          <span class="status-badge ${t.status || 'completed'}">
            ${formatStatus(t.status || 'completed')}
          </span>
        </div>
      </div>
    </div>

    ${itemsHTML}

    <div style="border-top: 2px solid #e2e8f0; padding-top: var(--spacing-lg); margin-top: var(--spacing-lg);">
      <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-2);">
        <span style="color: #64748b;">Subtotal:</span>
        <span style="color: #1e293b;">${formatCurrency(t.total_amount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: var(--font-size-lg); font-weight: bold;">
        <span style="color: #1e293b;">Total:</span>
        <span style="color: #28A745;">${formatCurrency(t.total_amount)}</span>
      </div>
    </div>
  `;
}

function closeModal() {
  detailModal.classList.remove('show');
  document.body.style.overflow = 'auto';
  currentTransactionDetail = null;
}

// ============================================
// PRINT & EXPORT
// ============================================

function printReceipt(transactionId = null) {
  if (transactionId === null && !currentTransactionDetail) {
    return;
  }

  const transaction = transactionId ? 
    allTransactions.find(t => t.id === transactionId) : 
    currentTransactionDetail;

  if (!transaction) {
    showError('Data transaksi tidak ditemukan');
    return;
  }

  const printWindow = window.open('', '_blank');
  const items = transaction.items || [];

  const itemsHTML = items.map(item => `
    <tr>
      <td>${item.product_name}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - Transaction #${transaction.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 400px;
          margin: 0;
          padding: 20px;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .receipt-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        .receipt-subtitle {
          font-size: 12px;
          color: #666;
          margin: 5px 0 0 0;
        }
        .receipt-details {
          font-size: 12px;
          margin-bottom: 15px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 12px;
        }
        th {
          border-bottom: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        td {
          padding: 5px;
          border-bottom: 1px solid #ddd;
        }
        .text-right {
          text-align: right;
        }
        .receipt-total {
          font-size: 14px;
          font-weight: bold;
          text-align: right;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #000;
        }
        .receipt-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <h1 class="receipt-title">DigiCaf</h1>
        <p class="receipt-subtitle">Struk Penjualan</p>
      </div>

      <div class="receipt-details">
        <div class="detail-row">
          <span>No. Transaksi:</span>
          <span>#${String(transaction.id).padStart(5, '0')}</span>
        </div>
        <div class="detail-row">
          <span>Tanggal:</span>
          <span>${formatDate(transaction.created_at || transaction.transaction_date)}</span>
        </div>
        <div class="detail-row">
          <span>Waktu:</span>
          <span>${formatTime(transaction.created_at || transaction.transaction_date)}</span>
        </div>
        <div class="detail-row">
          <span>Customer:</span>
          <span>${transaction.customer_name || 'Walk-in'}</span>
        </div>
        <div class="detail-row">
          <span>Karyawan:</span>
          <span>${transaction.employee_name || '-'}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Harga</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="receipt-total">
        TOTAL: ${formatCurrency(transaction.total_amount)}
      </div>

      <div class="receipt-footer">
        <p>Terima kasih atas pembelian Anda!</p>
        <p>${new Date().toLocaleString('id-ID')}</p>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function exportTransactions() {
  if (filteredTransactions.length === 0) {
    showError('Tidak ada data untuk diekspor');
    return;
  }

  // Prepare CSV data
  let csv = 'ID Transaksi,Tanggal,Customer,Karyawan,Total,Pembayaran,Status\n';
  
  filteredTransactions.forEach(transaction => {
    csv += `"#${String(transaction.id).padStart(5, '0')}",`;
    csv += `"${formatDateTime(transaction.created_at || transaction.transaction_date)}",`;
    csv += `"${transaction.customer_name || 'Walk-in'}",`;
    csv += `"${transaction.employee_name || '-'}",`;
    csv += `"${transaction.total_amount}",`;
    csv += `"${transaction.payment_method || '-'}",`;
    csv += `"${transaction.status || 'completed'}"\n`;
  });

  // Download CSV
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
  element.setAttribute('download', `riwayat-transaksi-${new Date().toISOString().split('T')[0]}.csv`);
  element.style.display = 'none';
  
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);

  showSuccess('Data berhasil diekspor');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatTime(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

function formatPaymentMethod(method) {
  const methods = {
    'cash': 'Tunai',
    'card': 'Kartu',
    'transfer': 'Transfer',
    'e-wallet': 'E-Wallet'
  };
  return methods[method] || method || '-';
}

function formatStatus(status) {
  const statuses = {
    'completed': 'Selesai',
    'pending': 'Menunggu',
    'cancelled': 'Dibatalkan'
  };
  return statuses[status] || status;
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

function showError(message) {
  console.error(message);
  // If toast.js is available, use it
  if (typeof showToast === 'function') {
    showToast(message, 'error');
  } else {
    alert(message);
  }
}

function showSuccess(message) {
  console.log(message);
  // If toast.js is available, use it
  if (typeof showToast === 'function') {
    showToast(message, 'success');
  }
}
