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

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const itemsHTML = items.length > 0
    ? `
      <h3 style="margin: var(--spacing-lg) 0 var(--spacing-sm);">Menu Dipesan</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Menu</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Harga</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const qty = item.quantity || 0;
            const price = item.unit_price || 0;
            const subtotal = item.subtotal != null ? item.subtotal : price * qty;
            return `
              <tr>
                <td>${item.product_name}</td>
                <td style="text-align: center;">${qty}</td>
                <td style="text-align: right;">${formatCurrency(price)}</td>
                <td style="text-align: right;">${formatCurrency(subtotal)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">Total</td>
            <td style="text-align: right; font-weight: bold; color: #28A745;">
              ${formatCurrency(t.total_amount)}
            </td>
          </tr>
        </tfoot>
      </table>
    `
    : `
      <h3 style="margin: var(--spacing-lg) 0 var(--spacing-sm);">Menu Dipesan</h3>
      <div style="color: #64748b;">Tidak ada item tercatat</div>
    `;

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
      <div class="detail-item">
        <div class="detail-label">Jumlah Item</div>
        <div class="detail-value">${itemCount} item</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Total</div>
        <div class="detail-value" style="color: #28A745; font-weight: bold;">
          ${formatCurrency(t.total_amount)}
        </div>
      </div>
    </div>

    ${itemsHTML}
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

async function printReceipt(transactionId = null) {
  if (transactionId === null && !currentTransactionDetail) {
    return;
  }

  let transaction = transactionId
    ? allTransactions.find(t => t.id === transactionId)
    : currentTransactionDetail;

  if (transactionId && (!transaction || !transaction.items)) {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`);
      if (response.ok) {
        transaction = await response.json();
      }
    } catch (error) {
      console.error('Error loading receipt transaction:', error);
    }
  }

  if (!transaction) {
    showError('Data transaksi tidak ditemukan');
    return;
  }

  if (typeof receiptManager === 'undefined' || !receiptManager) {
    showError('Template struk belum tersedia');
    return;
  }

  const items = Array.isArray(transaction.items) ? transaction.items : [];
  const receiptItems = items.map((item) => {
    const quantity = Number(item.quantity ?? item.qty ?? 0) || 0;
    const price = Number(item.unit_price ?? item.price ?? 0) || 0;
    const subtotal = Number(item.subtotal ?? (quantity * price)) || 0;

    return {
      name: item.product_name || item.name || 'Produk',
      quantity,
      price,
      subtotal
    };
  });

  const subtotal = receiptItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const total = Number(transaction.total_amount ?? subtotal) || subtotal;
  const paymentMethodRaw = String(transaction.payment_method || 'cash');
  const paymentMethod = paymentMethodRaw === 'e-wallet' ? 'ewallet' : paymentMethodRaw;

  const receiptPayload = {
    transactionId: transaction.id,
    items: receiptItems,
    subtotal,
    tax: 0,
    discount: 0,
    total,
    paymentMethod,
    paymentAmount: total,
    changeAmount: 0,
    customerName: transaction.customer_name || null,
    timestamp: transaction.created_at || transaction.transaction_date || new Date(),
    cashier: transaction.employee_name || 'Admin'
  };

  receiptManager.showReceipt(receiptPayload);
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
