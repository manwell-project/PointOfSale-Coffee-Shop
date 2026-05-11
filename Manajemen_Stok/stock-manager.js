/**
 * Stock Management JavaScript
 * DigiCaf Coffee Shop POS System
 */

// Data management
let stocks = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: 'name', direction: 'asc' };
let currentFilters = { search: '', category: '', status: '' };
let isLoadingStocks = false;

// Alerts state
let currentAlerts = [];
let currentAlertFilter = 'all';
let readAlertKeys = new Set();
const ALERTS_READ_STORAGE_KEY = 'digicaf.stockAlerts.readKeys';

// DOM Elements
const stockModal = document.getElementById('stockModal');
const stockForm = document.getElementById('stockForm');
const stockOutModal = document.getElementById('stockOutModal');
const stockOutForm = document.getElementById('stockOutForm');
const stockOutSelect = document.getElementById('stockOutStockId');
const stockOutCurrentQtyInput = document.getElementById('stockOutCurrentQty');
const stockOutQtyInput = document.getElementById('stockOutQty');
const stockOutReasonInput = document.getElementById('stockOutReason');
const stockOutEmployeeIdInput = document.getElementById('stockOutEmployeeId');
const searchInput = document.getElementById('searchStockInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const stockTableBody = document.getElementById('stockTableBody');
const alertsWidget = document.getElementById('alertsWidget');
const alertsList = document.getElementById('alertsList');
const alertsPopover = document.getElementById('alertsPopover');
const alertsToggleBtn = document.getElementById('alertsToggleBtn');

// Initialize
async function init() {
    setupEventListeners();
    setupSortableColumns();
    await loadStocks();
}

function setupEventListeners() {
    // Modal controls
    document.getElementById('addStockBtn').addEventListener('click', () => openModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    stockForm.addEventListener('submit', saveStock);

    // Stock out (Barang Keluar)
    const stockOutBtn = document.getElementById('stockOutBtn');
    if (stockOutBtn) {
        stockOutBtn.addEventListener('click', () => {
            openStockOutModal().catch((err) => {
                showNotification('Gagal membuka form barang keluar: ' + (err?.message || err), 'error');
            });
        });
    }
    const stockOutCloseBtn = document.getElementById('stockOutCloseModalBtn');
    if (stockOutCloseBtn) {
        stockOutCloseBtn.addEventListener('click', closeStockOutModal);
    }
    const stockOutCancelBtn = document.getElementById('stockOutCancelBtn');
    if (stockOutCancelBtn) {
        stockOutCancelBtn.addEventListener('click', closeStockOutModal);
    }
    if (stockOutForm) {
        stockOutForm.addEventListener('submit', saveStockOut);
    }
    if (stockOutSelect) {
        stockOutSelect.addEventListener('change', syncStockOutSelection);
    }

    // History page
    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = 'riwayat.html';
        });
    }
    
    // Filters
    searchInput.addEventListener('input', debounce(() => {
        currentFilters.search = searchInput.value;
        currentPage = 1;
        renderTable();
    }, 300));
    
    categoryFilter.addEventListener('change', () => {
        currentFilters.category = categoryFilter.value;
        currentPage = 1;
        renderTable();
    });
    
    statusFilter.addEventListener('change', () => {
        currentFilters.status = statusFilter.value;
        currentPage = 1;
        renderTable();
    });

    // Close modal on overlay click
    stockModal.addEventListener('click', (e) => {
        if (e.target === stockModal) closeModal();
    });

    if (stockOutModal) {
        stockOutModal.addEventListener('click', (e) => {
            if (e.target === stockOutModal) closeStockOutModal();
        });
    }

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Alert actions
    document.querySelectorAll('.btn-alert-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-alert-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterAlerts(this.dataset.filter);
        });
    });

    // Alerts popover toggle
    if (alertsToggleBtn && alertsWidget) {
        alertsToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleAlertsPopover();
        });
    }

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
        if (!alertsWidget || !alertsPopover) return;
        if (!alertsWidget.classList.contains('open')) return;
        if (alertsPopover.contains(e.target)) return;
        closeAlertsPopover();
    });

    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            markAllAlertsRead();
        });
    }

    // 'Lihat Semua' removed (popover is already scrollable)

    // Mark individual alert as read when clicked (event delegation)
    if (alertsList) {
        alertsList.addEventListener('click', (e) => {
            const alertItem = e.target.closest('.alert-item');
            if (!alertItem) return;
            const key = alertItem.dataset.alertKey;
            if (!key) return;
            markAlertReadByKey(key);
        });
    }
}

async function openStockOutModal(prefillStockId = null) {
    if (!stockOutModal || !stockOutForm || !stockOutSelect) return;

    // Open first so user sees something even if loading
    stockOutModal.classList.add('active');

    stockOutForm.reset();
    setStockOutSelectLoading();
    setStockOutSaveEnabled(false);

    // Ensure stocks are loaded (do not block UI interactions)
    if ((!stocks || !stocks.length) && !isLoadingStocks) {
        try {
            await loadStocks();
        } catch {
            // loadStocks already shows notification/table state
        }
    }

    populateStockOutOptions(stocks || [], prefillStockId);
    syncStockOutSelection();
}

function closeStockOutModal() {
    if (!stockOutModal) return;
    stockOutModal.classList.remove('active');
}

function populateStockOutOptions(selectableStocks, prefillStockId = null) {
    if (!stockOutSelect) return;

    const items = Array.isArray(selectableStocks) ? selectableStocks : [];
    if (!items.length) {
        stockOutSelect.innerHTML = '<option value="" disabled selected>Tidak ada data stok</option>';
        return;
    }

    const optionsHtml = ['<option value="" disabled selected>Pilih barang...</option>'];

    items
        .slice()
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id'))
        .forEach((s) => {
            const id = Number(s.id);
            if (!Number.isFinite(id)) return;
            const qty = Number(s.quantity) || 0;
            const name = escapeHtml(String(s.name || ''));
            const disabled = qty <= 0 ? 'disabled' : '';
            optionsHtml.push(`<option value="${id}" ${disabled}>${name} (stok: ${qty})</option>`);
        });

    stockOutSelect.innerHTML = optionsHtml.join('');

    if (prefillStockId !== null && prefillStockId !== undefined && prefillStockId !== '') {
        const targetId = String(prefillStockId);
        try {
            const opt = stockOutSelect.querySelector(`option[value="${CSS.escape(targetId)}"]`);
            if (opt && !opt.disabled) {
                stockOutSelect.value = targetId;
            }
        } catch {
            // ignore CSS.escape issues
        }
    }
}

function syncStockOutSelection() {
    if (!stockOutSelect || !stockOutCurrentQtyInput || !stockOutQtyInput) return;

    const selectedId = Number(stockOutSelect.value);
    const stock = (stocks || []).find(s => Number(s.id) === selectedId);
    const currentQty = Number(stock?.quantity) || 0;

    stockOutCurrentQtyInput.value = currentQty;
    stockOutQtyInput.max = String(Math.max(currentQty, 1));

    // If current input exceeds stock, clamp it
    const outQty = Number(stockOutQtyInput.value) || 1;
    if (outQty > currentQty && currentQty > 0) {
        stockOutQtyInput.value = String(currentQty);
    }

    if (!Number.isFinite(selectedId)) {
        setStockOutSaveEnabled(false);
        return;
    }

    if (currentQty <= 0) {
        stockOutQtyInput.value = '1';
        setStockOutSaveEnabled(false);
        return;
    }

    setStockOutSaveEnabled(true);
}

function setStockOutSaveEnabled(enabled) {
    const btn = document.getElementById('stockOutSaveBtn');
    if (!btn) return;
    btn.disabled = !enabled;
}

function setStockOutSelectLoading() {
    if (!stockOutSelect) return;
    stockOutSelect.innerHTML = '<option value="" disabled selected>Memuat daftar barang...</option>';
}

async function saveStockOut(e) {
    e.preventDefault();

    if (!stockOutSelect || !stockOutQtyInput) return;

    const stockId = Number(stockOutSelect.value);
    if (!Number.isFinite(stockId)) {
        showNotification('Pilih barang terlebih dahulu', 'error');
        return;
    }

    const stock = (stocks || []).find(s => Number(s.id) === stockId);
    const currentQty = Number(stock?.quantity) || 0;
    const outQty = Math.trunc(Number(stockOutQtyInput.value));

    if (!Number.isFinite(outQty) || outQty <= 0) {
        showNotification('Jumlah keluar harus lebih dari 0', 'error');
        return;
    }
    if (outQty > currentQty) {
        showNotification('Jumlah keluar melebihi stok saat ini', 'error');
        return;
    }

    const newQty = currentQty - outQty;
    const reasonRaw = stockOutReasonInput ? String(stockOutReasonInput.value || '').trim() : '';
    const employeeIdRaw = stockOutEmployeeIdInput ? String(stockOutEmployeeIdInput.value || '').trim() : '';
    const employeeIdNum = employeeIdRaw ? Number(employeeIdRaw) : undefined;
    const payload = {
        quantity: newQty,
        change_reason: reasonRaw || 'Barang keluar',
        employee_id: Number.isFinite(employeeIdNum) && employeeIdNum > 0 ? employeeIdNum : undefined
    };

    try {
        await window.API.Stocks.update(stockId, payload);
        showNotification('Barang keluar berhasil disimpan', 'success');
        closeStockOutModal();
        await loadStocks();
    } catch (err) {
        showNotification('Gagal menyimpan barang keluar: ' + (err.message || err), 'error');
    }
}

function setupSortableColumns() {
    document.querySelectorAll('.stock-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (currentSort.field === field) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.direction = 'asc';
            }
            
            // Update UI
            document.querySelectorAll('.stock-table th.sortable').forEach(h => {
                h.classList.remove('asc', 'desc');
            });
            th.classList.add(currentSort.direction);
            
            renderTable();
        });
    });
}

async function loadStocks() {
    isLoadingStocks = true;
    try {
        stocks = await window.API.Stocks.getAll();
        updateStats();
        renderTable();
        renderAlerts();
    } catch (err) {
        showNotification('Gagal memuat data: ' + err.message, 'error');
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
                        <h3 class="empty-title">Gagal Memuat Data</h3>
                        <p class="empty-text">${err.message}</p>
                    </div>
                </td>
            </tr>
        `;
    } finally {
        isLoadingStocks = false;
    }
}

function renderTable() {
    let filtered = filterStocks();
    let sorted = sortStocks(filtered);
    
    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = sorted.slice(start, end);

    if (paginated.length === 0) {
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-box-open"></i></div>
                        <h3 class="empty-title">Tidak Ada Data</h3>
                        <p class="empty-text">Belum ada produk yang ditambahkan atau tidak ada hasil yang sesuai dengan filter</p>
                    </div>
                </td>
            </tr>
        `;
        updatePagination(0);
        return;
    }

    stockTableBody.innerHTML = paginated.map(stock => {
        const qty = stock.quantity || 0;
        const minQty = stock.min_stock !== undefined ? stock.min_stock : (stock.minStock || 0);
        const status = getStockStatus(qty, minQty);
        const percentage = minQty > 0 ? Math.min((qty / (minQty * 2)) * 100, 100) : 100;
        
        return `
            <tr>
                <td class="product-cell">
                    <div class="product-info">
                        <div class="product-image">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="product-details">
                            <div class="product-name">${escapeHtml(stock.name)}</div>
                            <div class="product-meta">
                                <span class="product-sku">SKU-${stock.id}</span>
                                <span class="product-category">
                                    <i class="fas fa-tag"></i>
                                    ${getCategoryName(stock.category || 'coffee')}
                                </span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="quantity-cell">
                    <div class="quantity-display">
                        <div class="quantity-value">
                            ${qty}
                            <span class="quantity-unit">unit</span>
                        </div>
                        <div class="quantity-bar">
                            <div class="quantity-bar-fill ${getBarClass(qty, minQty)}" style="width: ${percentage}%"></div>
                        </div>
                        <div class="quantity-limits">
                            <span>Min: ${minQty}</span>
                            <span>Max: ${minQty * 2}</span>
                        </div>
                    </div>
                </td>
                <td class="status-cell">
                    <span class="stock-status ${status}">
                        <i class="fas fa-circle"></i>
                        ${getStatusText(status)}
                    </span>
                </td>
                <td class="price-cell">
                    <div class="price-display">
                        <div class="price-label">Harga Jual</div>
                        <div class="price-value">Rp ${formatNumber(stock.sellPrice || 0)}</div>
                    </div>
                </td>
                <td class="updated-cell">
                    <div class="updated-time">
                        <div class="updated-date">${formatDate(stock.updated_at || stock.created_at)}</div>
                        <div class="updated-ago">
                            <i class="fas fa-clock"></i>
                            ${getTimeAgo(stock.updated_at || stock.created_at)}
                        </div>
                    </div>
                </td>
                <td class="actions-cell">
                    <div class="table-actions">
                        <button class="btn-icon edit" onclick="openModal(${stock.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteStock(${stock.id})" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updatePagination(sorted.length);
    updateShowingText(start + 1, Math.min(end, sorted.length), sorted.length);
}

function filterStocks() {
    return stocks.filter(stock => {
        // Search filter
        if (currentFilters.search) {
            const search = currentFilters.search.toLowerCase();
            const matchName = (stock.name || '').toLowerCase().includes(search);
            const matchSku = ('SKU-' + stock.id).toLowerCase().includes(search);
            if (!matchName && !matchSku) return false;
        }
        
        // Category filter
        if (currentFilters.category && stock.category !== currentFilters.category) {
            return false;
        }
        
        // Status filter
        if (currentFilters.status) {
            const qty = stock.quantity || 0;
            const minQty = stock.min_stock !== undefined ? stock.min_stock : (stock.minStock || 0);
            const status = getStockStatus(qty, minQty);
            if (status !== currentFilters.status) return false;
        }
        
        return true;
    });
}

function sortStocks(stocks) {
    return stocks.sort((a, b) => {
        let aVal, bVal;
        
        switch(currentSort.field) {
            case 'name':
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
                break;
            case 'quantity':
                aVal = a.quantity || 0;
                bVal = b.quantity || 0;
                break;
            case 'status':
                aVal = getStockStatus(a.quantity || 0, a.min_stock || a.minStock || 0);
                bVal = getStockStatus(b.quantity || 0, b.min_stock || b.minStock || 0);
                break;
            case 'price':
                aVal = a.sellPrice || 0;
                bVal = b.sellPrice || 0;
                break;
            case 'updated':
                aVal = new Date(a.updated_at || a.created_at || 0);
                bVal = new Date(b.updated_at || b.created_at || 0);
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function updateStats() {
    const total = stocks.length;
    const totalQty = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const lowStock = stocks.filter(s => {
        const qty = s.quantity || 0;
        const minQty = s.min_stock !== undefined ? s.min_stock : (s.minStock || 0);
        return qty > 0 && qty <= minQty;
    }).length;
    const outStock = stocks.filter(s => (s.quantity || 0) === 0).length;

    document.getElementById('totalProducts').textContent = total;
    document.getElementById('totalStockQty').textContent = totalQty;
    document.getElementById('lowStockCount').textContent = lowStock;
    document.getElementById('outStockCount').textContent = outStock;
}

function renderAlerts() {
    const criticalStocks = stocks.filter(s => (s.quantity || 0) === 0);
    const warningStocks = stocks.filter(s => {
        const qty = s.quantity || 0;
        const minQty = s.min_stock !== undefined ? s.min_stock : (s.minStock || 0);
        return qty > 0 && qty <= minQty;
    });

    const totalAlerts = criticalStocks.length + warningStocks.length;
    
    if (totalAlerts === 0) {
        if (alertsWidget) {
            alertsWidget.style.display = 'none';
            alertsWidget.classList.remove('open', 'expanded');
        }
        if (alertsToggleBtn) {
            alertsToggleBtn.style.display = 'none';
            alertsToggleBtn.setAttribute('aria-expanded', 'false');
        }
        return;
    }

    if (alertsToggleBtn) {
        alertsToggleBtn.style.display = '';
    }

    // Widget is shown/hidden via popover toggle, but keep it in the DOM when alerts exist
    if (alertsWidget) {
        alertsWidget.style.display = 'block';
    }

    updateAlertBadges();

    const alerts = [
        ...criticalStocks.map(s => ({ ...s, type: 'critical', message: 'Stok habis, segera lakukan restock' })),
        ...warningStocks.map(s => ({ ...s, type: 'warning', message: 'Stok mendekati batas minimum' }))
    ];

    currentAlerts = alerts;
    renderAlertsList();
}

function updateAlertBadges() {
    const unreadCount = (currentAlerts || []).filter(a => !readAlertKeys.has(getAlertKey(a))).length;

    const badgeTop = document.getElementById('alertsBadge');
    if (badgeTop) {
        badgeTop.textContent = unreadCount;
        badgeTop.style.display = unreadCount > 0 ? '' : 'none';
    }

    const badgeWidget = document.getElementById('alertsBadgeWidget');
    if (badgeWidget) {
        badgeWidget.textContent = unreadCount;
        badgeWidget.style.display = unreadCount > 0 ? '' : 'none';
    }
}

function toggleAlertsPopover() {
    if (!alertsWidget || !alertsToggleBtn) return;
    const willOpen = !alertsWidget.classList.contains('open');
    if (willOpen) {
        openAlertsPopover();
    } else {
        closeAlertsPopover();
    }
}

function openAlertsPopover() {
    if (!alertsWidget || !alertsToggleBtn) return;
    alertsWidget.classList.add('open');
    alertsToggleBtn.setAttribute('aria-expanded', 'true');
}

function closeAlertsPopover() {
    if (!alertsWidget || !alertsToggleBtn) return;
    alertsWidget.classList.remove('open');
    alertsToggleBtn.setAttribute('aria-expanded', 'false');
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-btn" disabled>...</span>`;
        }
    }

    html += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = html;
}

function updateShowingText(start, end, total) {
    document.getElementById('showingText').textContent = `Menampilkan ${start}-${end} dari ${total} produk`;
}

function changePage(page) {
    currentPage = page;
    renderTable();
}

function openModal(id = null) {
    const titleEl = document.querySelector('#modalTitle i');
    const titleText = document.querySelector('#modalTitle');
    
    if (id) {
        const stock = stocks.find(s => s.id === id);
        if (!stock) return;
        
        titleEl.className = 'fas fa-edit';
        titleText.innerHTML = '<i class="fas fa-edit"></i> Edit Stok';
        document.querySelector('.modal-subtitle').textContent = 'Perbarui informasi produk';
        
        document.getElementById('stockId').value = stock.id;
        document.getElementById('productName').value = stock.name || '';
        document.getElementById('productSku').value = 'SKU-' + stock.id;
        document.getElementById('productCategory').value = stock.category || 'coffee';
        document.getElementById('quantity').value = stock.quantity || 0;
        document.getElementById('minStock').value = stock.min_stock !== undefined ? stock.min_stock : (stock.minStock || 0);
        document.getElementById('costPrice').value = stock.costPrice || 0;
        document.getElementById('sellPrice').value = stock.sellPrice || 0;
        document.getElementById('supplierName').value = stock.supplierName || '';
        document.getElementById('supplierContact').value = stock.supplierContact || '';
    } else {
        titleEl.className = 'fas fa-plus-circle';
        titleText.innerHTML = '<i class="fas fa-plus-circle"></i> Tambah Stok Baru';
        document.querySelector('.modal-subtitle').textContent = 'Lengkapi informasi produk di bawah ini';
        stockForm.reset();
        document.getElementById('stockId').value = '';
    }
    
    stockModal.classList.add('active');
}

function closeModal() {
    stockModal.classList.remove('active');
}

async function saveStock(e) {
    e.preventDefault();
    
    const id = document.getElementById('stockId').value;
    const data = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        quantity: parseInt(document.getElementById('quantity').value) || 0,
        min_stock: parseInt(document.getElementById('minStock').value) || 0,
        costPrice: parseInt(document.getElementById('costPrice').value) || 0,
        sellPrice: parseInt(document.getElementById('sellPrice').value) || 0,
        supplierName: document.getElementById('supplierName').value.trim(),
        supplierContact: document.getElementById('supplierContact').value.trim()
    };

    try {
        if (id) {
            await window.API.Stocks.update(parseInt(id), data);
            showNotification('Stok berhasil diperbarui', 'success');
        } else {
            await window.API.Stocks.create(data);
            showNotification('Stok berhasil ditambahkan', 'success');
        }
        closeModal();
        await loadStocks();
    } catch (err) {
        showNotification('Gagal menyimpan: ' + err.message, 'error');
    }
}

async function deleteStock(id) {
    if (!confirm('Yakin ingin menghapus stok ini?')) return;
    
    try {
        await window.API.Stocks.delete(id);
        showNotification('Stok berhasil dihapus', 'success');
        await loadStocks();
    } catch (err) {
        showNotification('Gagal menghapus: ' + err.message, 'error');
    }
}

function exportData() {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-data-${formatDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data berhasil diexport', 'success');
}

function generateCSV() {
    const headers = ['SKU', 'Nama', 'Kategori', 'Stok', 'Min Stok', 'Status', 'Harga Beli', 'Harga Jual'];
    const rows = stocks.map(s => {
        const qty = s.quantity || 0;
        const minQty = s.min_stock !== undefined ? s.min_stock : (s.minStock || 0);
        return [
            'SKU-' + s.id,
            s.name,
            getCategoryName(s.category || 'coffee'),
            qty,
            minQty,
            getStatusText(getStockStatus(qty, minQty)),
            s.costPrice || 0,
            s.sellPrice || 0
        ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}

// Helper functions
function getStockStatus(qty, minQty) {
    if (qty === 0) return 'out-stock';
    if (qty <= minQty) return 'low-stock';
    return 'in-stock';
}

function getStatusText(status) {
    const texts = {
        'in-stock': 'In Stock',
        'low-stock': 'Stok Rendah',
        'out-stock': 'Habis'
    };
    return texts[status] || status;
}

function getBarClass(qty, minQty) {
    if (qty === 0) return 'critical';
    if (qty <= minQty) return 'low';
    if (qty <= minQty * 1.5) return 'medium';
    return 'high';
}

function getCategoryName(category) {
    const names = {
        'coffee': 'Kopi',
        'tea': 'Teh',
        'snack': 'Snack',
        'ingredient': 'Bahan'
    };
    return names[category] || category;
}

function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTimeAgo(date) {
    if (!date) return '-';
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000); // seconds
    
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
    if (diff < 2592000) return Math.floor(diff / 86400) + ' hari lalu';
    return formatDate(date);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function debounce(func, wait) {
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

function showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#0ea5e9'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function filterAlerts(filter) {
    currentAlertFilter = filter || 'all';
    renderAlertsList();
}

function loadReadAlertKeys() {
    try {
        const raw = localStorage.getItem(ALERTS_READ_STORAGE_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return new Set();
        return new Set(arr.filter(Boolean));
    } catch {
        return new Set();
    }
}

function saveReadAlertKeys() {
    try {
        localStorage.setItem(ALERTS_READ_STORAGE_KEY, JSON.stringify(Array.from(readAlertKeys)));
    } catch {
        // ignore storage failures (private mode / quota)
    }
}

function getAlertKey(alert) {
    return `${alert.type}:${alert.id}`;
}

function markAlertReadByKey(key) {
    if (!key) return;
    if (readAlertKeys.has(key)) return;
    readAlertKeys.add(key);
    saveReadAlertKeys();
    renderAlertsList();
    updateAlertBadges();
}

function markAllAlertsRead() {
    currentAlerts.forEach(a => readAlertKeys.add(getAlertKey(a)));
    saveReadAlertKeys();
    renderAlertsList();
    updateAlertBadges();
    showNotification('Semua notifikasi ditandai sudah dibaca', 'success');
}

function renderAlertsList() {
    if (!alertsList) return;

    let filtered = currentAlerts;
    if (currentAlertFilter && currentAlertFilter !== 'all') {
        filtered = currentAlerts.filter(a => a.type === currentAlertFilter);
    }

    // Keep compact behavior (first 5)
    const visibleAlerts = filtered.slice(0, 5);

    if (visibleAlerts.length === 0) {
        alertsList.innerHTML = `
            <div class="alerts-empty">
                <div class="empty-alert-icon"><i class="fas fa-bell-slash"></i></div>
                <div class="empty-alert-title">Tidak ada notifikasi</div>
                <div class="empty-alert-text">Coba pilih filter lain</div>
            </div>
        `;
        return;
    }

    alertsList.innerHTML = visibleAlerts.map(alert => {
        const key = getAlertKey(alert);
        const isUnread = !readAlertKeys.has(key);
        return `
            <div class="alert-item ${alert.type}${isUnread ? ' unread' : ''}" data-alert-key="${key}">
                <div class="alert-item-icon">
                    <i class="fas fa-${alert.type === 'critical' ? 'times-circle' : 'exclamation-triangle'}"></i>
                    <span class="priority-dot"></span>
                </div>
                <div class="alert-item-content">
                    <div class="alert-item-header">
                        <div class="alert-item-title">${escapeHtml(alert.name)}</div>
                        <div class="alert-item-time">${getTimeAgo(alert.updated_at || alert.created_at)}</div>
                    </div>
                    <div class="alert-item-message">${alert.message}</div>
                    <div class="alert-item-details">
                        <div class="alert-detail">
                            <i class="fas fa-box"></i>
                            Stok: <strong>${alert.quantity || 0} unit</strong>
                        </div>
                        <div class="alert-detail">
                            <i class="fas fa-chart-line"></i>
                            Min: <strong>${alert.min_stock !== undefined ? alert.min_stock : (alert.minStock || 0)} unit</strong>
                        </div>
                    </div>
                    <div class="alert-item-actions">
                        <button class="btn-alert-action primary" onclick="openModal(${alert.id})">
                            <i class="fas fa-edit"></i>
                            Edit Stok
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateAlertBadges();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    readAlertKeys = loadReadAlertKeys();
    init();
    // Refresh every 30 seconds
    setInterval(loadStocks, 30000);
});
