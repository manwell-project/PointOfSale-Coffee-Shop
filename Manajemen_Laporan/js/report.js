/**
 * Report Management JavaScript
 * Handles report page initialization and report core features
 */

if (window.Framework7 && document.getElementById('app')) {
    window.reportF7App = new Framework7({
        el: '#app',
        name: 'DigiCaf',
        theme: 'auto'
    });
}

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

const dateFromInput = document.getElementById('dateFrom');
const dateToInput = document.getElementById('dateTo');
const reportTitleEl = document.getElementById('reportContentTitle');
const reportPeriodEl = document.getElementById('reportPeriod');
const reportTable = document.getElementById('reportTable');
const reportTableBody = document.getElementById('reportTableBody');
const reportGridView = document.getElementById('reportGridView');
const tableTotalEl = document.getElementById('tableTotal');
const tableTitleEl = document.querySelector('.table-title');
const tableLoadingEl = document.getElementById('tableLoading');
const tableEmptyEl = document.getElementById('tableEmpty');
const tablePaginationEl = document.getElementById('tablePagination');
const paginationInfoEl = document.getElementById('paginationInfo');
const paginationButtonsEl = document.getElementById('paginationButtons');
const btnPrevPage = document.getElementById('btnPrevPage');
const btnNextPage = document.getElementById('btnNextPage');
const tableSearchInput = document.getElementById('tableSearch');
const categoryFilterGroup = document.getElementById('categoryFilterGroup');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');
const filterPayment = document.getElementById('filterPayment');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const cancelFilterBtn = document.getElementById('cancelFilterBtn');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const presetButtons = document.querySelectorAll('.preset-btn');
const reportTabs = document.querySelectorAll('.report-tab');
const tableHeaderCells = document.querySelectorAll('#reportTable thead th');
const sortableHeaderCells = document.querySelectorAll('#reportTable thead th.sortable');
const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');

const badgeSalesEl = document.getElementById('badgeSales');
const badgeProductsEl = document.getElementById('badgeProducts');
const badgeEmployeesEl = document.getElementById('badgeEmployees');

const totalRevenueEl = document.getElementById('totalRevenue');
const totalTransactionsEl = document.getElementById('totalTransactions');
const totalProductsSoldEl = document.getElementById('totalProductsSold');
const avgTransactionEl = document.getElementById('avgTransaction');
const summaryLabels = document.querySelectorAll('.summary-card .summary-label');

const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const printReportBtn = document.getElementById('printReportBtn');

const profitRevenueEl = document.getElementById('profitRevenue');
const profitExpenseEl = document.getElementById('profitExpense');
const profitHPPEl = document.getElementById('profitHPP');
const profitGrossEl = document.getElementById('profitGross');
const profitOperationalEl = document.getElementById('profitOperational');
const profitEmployeeEl = document.getElementById('profitEmployee');
const profitOtherEl = document.getElementById('profitOther');
const profitNetEl = document.getElementById('profitNet');
const profitMarginEl = document.getElementById('profitMargin');
const profitStatusEl = document.getElementById('profitStatus');

// ============================================
// STATE MANAGEMENT
// ============================================

let transactions = [];
let filteredTransactions = [];
let currentRows = [];
let rawStockHistory = [];
let rawMaterialPrices = new Map();
let currentReport = 'sales';
let currentViewMode = 'table';
let currentPage = 1;
const pageSize = 10;
let sortColumn = 'date';
let sortDirection = 'desc';

let appliedFilters = {
    dateFrom: '',
    dateTo: '',
    category: 'all',
    status: 'all',
    payment: 'all',
    search: ''
};

let draftFilters = { ...appliedFilters };

// ============================================
// INITIALIZATION
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReportPage);
} else {
    initializeReportPage();
}

function initializeReportPage() {
    setDefaultDateRange();
    initializeEventListeners();
    syncDraftFiltersFromControls();
    applyFiltersFromDraft(true);
    updateFilterVisibility();
    configureTableHeaders();
    loadReportData();
    console.log('Report Page Loaded');
}

function initializeEventListeners() {
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            syncDraftFiltersFromControls();
            applyFiltersFromDraft();
        });
    }

    if (cancelFilterBtn) {
        cancelFilterBtn.addEventListener('click', handleCancelFilter);
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', handleResetFilter);
    }

    presetButtons.forEach((button) => {
        button.addEventListener('click', () => handleDatePreset(button));
    });

    reportTabs.forEach((tab) => {
        tab.addEventListener('click', () => handleReportTabChange(tab));
    });

    sortableHeaderCells.forEach((header) => {
        header.addEventListener('click', () => handleSort(header));
    });

    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', handleSearchInput);
    }

    if (btnPrevPage) {
        btnPrevPage.addEventListener('click', () => changePage(currentPage - 1));
    }

    if (btnNextPage) {
        btnNextPage.addEventListener('click', () => changePage(currentPage + 1));
    }

    if (paginationButtonsEl) {
        paginationButtonsEl.addEventListener('click', (event) => {
            const target = event.target.closest('.pagination-btn[data-page]');
            if (!target) return;

            const page = Number(target.getAttribute('data-page'));
            if (Number.isFinite(page)) {
                changePage(page);
            }
        });
    }

    if (reportTableBody) {
        reportTableBody.addEventListener('click', (event) => {
            const actionButton = event.target.closest('.table-action-btn');
            if (!actionButton) return;

            const rowId = actionButton.getAttribute('data-id') || '-';
            const rowLabel = actionButton.getAttribute('data-label') || 'Data';
            showReportMessage(`${rowLabel} #${rowId}`, 'info');
        });
    }

    viewToggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            viewToggleButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');

            const viewMode = button.getAttribute('data-view');
            if (viewMode === 'grid' || viewMode === 'table') {
                currentViewMode = viewMode;
                renderTable();
            }
        });
    });

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', handleExportPdf);
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', handleExportExcel);
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', handleExportCsv);
    }

    if (printReportBtn) {
        printReportBtn.addEventListener('click', handlePrintReport);
    }
}

// ============================================
// DATA LOADING
// ============================================

async function loadReportData() {
    showLoading(true);

    try {
        const [transactionsResult, historyResult, rawStocksResult] = await Promise.allSettled([
            window.API.Transactions.getAll(),
            window.API.Stocks.getHistoryAll({ limit: 1000 }),
            window.API.Stocks.getAll()
        ]);

        const rawTransactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value : [];
        rawStockHistory = historyResult.status === 'fulfilled' ? historyResult.value : [];
        rawMaterialPrices = buildRawMaterialPriceMap(rawStocksResult.status === 'fulfilled' ? rawStocksResult.value : []);

        if (historyResult.status === 'rejected') {
            console.warn('Stock history unavailable for profit/loss:', historyResult.reason);
        }

        if (rawStocksResult.status === 'rejected') {
            console.warn('Raw stock prices unavailable for profit/loss:', rawStocksResult.reason);
        }

        transactions = await enrichTransactionsWithItems(rawTransactions || []);
        renderReport();
    } catch (error) {
        console.error('Error loading report data:', error);
        transactions = [];
        filteredTransactions = [];
        currentRows = [];
        rawStockHistory = [];
        rawMaterialPrices = new Map();
        renderReport();
        showReportMessage('Gagal memuat data laporan dari server.', 'error');
    } finally {
        showLoading(false);
    }
}

async function enrichTransactionsWithItems(rawTransactions) {
    const detailPromises = rawTransactions.map((transaction) =>
        window.API.Transactions.getById(transaction.id)
            .then((detail) => mergeTransactionDetail(transaction, detail))
            .catch(() => mergeTransactionDetail(transaction, null))
    );

    return Promise.all(detailPromises);
}

function mergeTransactionDetail(transaction, detail) {
    const txItems = normalizeTransactionItems(detail?.items);
    const itemCount = txItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    return {
        id: Number(transaction.id),
        createdAt: parseDateSafe(transaction.created_at),
        customerName: transaction.customer_name || 'Walk-in',
        employeeName: transaction.employee_name || 'Tanpa Karyawan',
        totalAmount: Number(transaction.total_amount) || 0,
        paymentMethod: normalizePayment(transaction.payment_method),
        status: normalizeStatus(transaction.status),
        items: txItems,
        itemCount
    };
}

// ============================================
// FILTERS, TABS, SORTING
// ============================================

function setDefaultDateRange() {
    if (!dateFromInput || !dateToInput) return;

    const today = new Date();
    // default range: 1 Jan 2025 to today
    dateFromInput.value = '2025-01-01';
    dateToInput.valueAsDate = today;
}

function handleDatePreset(button) {
    const preset = button.getAttribute('data-preset');
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (preset) {
        case 'today':
            break;
        case 'yesterday':
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
            break;
        case 'week': {
            const day = now.getDay();
            const diff = day === 0 ? 6 : day - 1;
            start.setDate(now.getDate() - diff);
            break;
        }
        case 'month':
            start.setDate(1);
            break;
        case 'year':
            start.setMonth(0, 1);
            break;
        default:
            return;
    }

    if (dateFromInput) dateFromInput.valueAsDate = start;
    if (dateToInput) dateToInput.valueAsDate = end;

    setActivePresetButton(button);
    syncDraftFiltersFromControls();
    applyFiltersFromDraft();
}

function setActivePresetButton(activeButton) {
    presetButtons.forEach((button) => {
        button.classList.toggle('active', button === activeButton);
    });
}

function handleReportTabChange(tab) {
    reportTabs.forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');

    currentReport = tab.getAttribute('data-report') || 'sales';
    currentPage = 1;

    configureTableHeaders();
    updateFilterVisibility();
    renderReport();
}

function handleSort(header) {
    const column = header.getAttribute('data-sort');
    if (!column) return;

    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    currentPage = 1;
    renderReport();
}

function handleSearchInput(event) {
    appliedFilters.search = (event.target.value || '').trim().toLowerCase();
    draftFilters.search = appliedFilters.search;
    currentPage = 1;
    renderReport();
}

function handleCancelFilter() {
    draftFilters = { ...appliedFilters };
    setControlsFromFilters(draftFilters);
    showReportMessage('Filter dikembalikan ke kondisi terakhir diterapkan.', 'info');
}

function handleResetFilter() {
    setDefaultDateRange();

    if (filterCategory) filterCategory.value = 'all';
    if (filterStatus) filterStatus.value = 'all';
    if (filterPayment) filterPayment.value = 'all';
    if (tableSearchInput) tableSearchInput.value = '';

    presetButtons.forEach((button) => button.classList.remove('active'));

    syncDraftFiltersFromControls();
    applyFiltersFromDraft();
}

function syncDraftFiltersFromControls() {
    draftFilters = {
        dateFrom: dateFromInput?.value || '',
        dateTo: dateToInput?.value || '',
        category: filterCategory?.value || 'all',
        status: filterStatus?.value || 'all',
        payment: filterPayment?.value || 'all',
        search: (tableSearchInput?.value || '').trim().toLowerCase()
    };
}

function setControlsFromFilters(filters) {
    if (dateFromInput) dateFromInput.value = filters.dateFrom || '';
    if (dateToInput) dateToInput.value = filters.dateTo || '';
    if (filterCategory) filterCategory.value = filters.category || 'all';
    if (filterStatus) filterStatus.value = filters.status || 'all';
    if (filterPayment) filterPayment.value = filters.payment || 'all';
    if (tableSearchInput) tableSearchInput.value = filters.search || '';
}

function applyFiltersFromDraft(skipMessage = false) {
    appliedFilters = { ...draftFilters };
    currentPage = 1;
    renderReport();

    if (!skipMessage) {
        showReportMessage('Filter laporan diterapkan.', 'success');
    }
}

function updateFilterVisibility() {
    if (!categoryFilterGroup) return;
    categoryFilterGroup.style.display = currentReport === 'products' ? '' : 'none';
}

function configureTableHeaders() {
    if (tableHeaderCells.length !== 8) return;

    const headerConfigByReport = {
        sales: [
            { label: 'ID', sort: 'id', sortable: true, number: false },
            { label: 'Tanggal', sort: 'date', sortable: true, number: false },
            { label: 'Pelanggan', sort: 'customer', sortable: true, number: false },
            { label: 'Item', sort: 'items', sortable: true, number: false },
            { label: 'Total', sort: 'amount', sortable: true, number: true },
            { label: 'Pembayaran', sort: 'payment', sortable: true, number: false },
            { label: 'Status', sort: '', sortable: false, number: false },
            { label: 'Aksi', sort: '', sortable: false, number: false }
        ],
        products: [
            { label: 'ID', sort: 'id', sortable: true, number: false },
            { label: 'Produk', sort: 'name', sortable: true, number: false },
            { label: 'Kategori', sort: 'category', sortable: true, number: false },
            { label: 'Terjual', sort: 'quantity', sortable: true, number: true },
            { label: 'Pendapatan', sort: 'amount', sortable: true, number: true },
            { label: 'Kontribusi', sort: 'share', sortable: true, number: false },
            { label: 'Status', sort: '', sortable: false, number: false },
            { label: 'Aksi', sort: '', sortable: false, number: false }
        ],
        employees: [
            { label: 'ID', sort: 'id', sortable: true, number: false },
            { label: 'Karyawan', sort: 'name', sortable: true, number: false },
            { label: 'Shift', sort: 'shift', sortable: true, number: false },
            { label: 'Transaksi', sort: 'transactions', sortable: true, number: true },
            { label: 'Total', sort: 'amount', sortable: true, number: true },
            { label: 'Rata-rata', sort: 'average', sortable: true, number: false },
            { label: 'Status', sort: '', sortable: false, number: false },
            { label: 'Aksi', sort: '', sortable: false, number: false }
        ]
    };

    const headerConfig = headerConfigByReport[currentReport] || headerConfigByReport.sales;

    tableHeaderCells.forEach((cell, index) => {
        const config = headerConfig[index];
        if (!config) return;

        cell.textContent = config.label;
        cell.setAttribute('data-sort', config.sort);

        if (config.sortable) {
            cell.classList.add('sortable');
        } else {
            cell.classList.remove('sortable', 'sorted-asc', 'sorted-desc');
        }

        if (config.number) {
            cell.classList.add('number');
        } else {
            cell.classList.remove('number');
        }
    });
}

// ============================================
// REPORT RENDERING
// ============================================

function renderReport() {
    configureTableHeaders();
    updateFilterVisibility();

    filteredTransactions = getFilteredTransactions();
    const completedTransactions = getCompletedTransactions(filteredTransactions);

    const salesRows = buildSalesRows(filteredTransactions);
    const productRows = buildProductRows(completedTransactions);
    const employeeRows = buildEmployeeRows(completedTransactions);

    updateTabBadges(salesRows.length, productRows.length, employeeRows.length);

    if (currentReport === 'products') {
        currentRows = productRows;
    } else if (currentReport === 'employees') {
        currentRows = employeeRows;
    } else {
        currentRows = salesRows;
    }

    currentRows = sortRows(currentRows);
    updateSummaryCards(completedTransactions, productRows, employeeRows);
    updateProfitLoss(completedTransactions);
    // Render product trend (Top 5) chart
    try { renderProductTrendChart(productRows); } catch (e) { console.warn('Product chart render failed', e); }
    updateReportMeta();
    renderTable();
}

function updateProfitLoss(salesData) {
    if (!profitRevenueEl || !profitHPPEl || !profitGrossEl || !profitNetEl || !profitMarginEl) return;

    const revenue = (Array.isArray(salesData) ? salesData : []).reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
    const hpp = calculateStockExpense();
    const gross = revenue - hpp;

    // placeholders for costs: to be integrated with expenses/HR module if available
    const operational = 0;
    const employee = 0;
    const other = 0;

    const net = gross - operational - employee - other;
    const margin = revenue > 0 ? (net / revenue) * 100 : 0;

    setElementText(profitRevenueEl, formatCurrency(revenue));
    setElementText(profitHPPEl, formatCurrency(hpp));
    setElementText(profitGrossEl, formatCurrency(gross));
    setElementText(profitOperationalEl, formatCurrency(operational));
    setElementText(profitEmployeeEl, formatCurrency(employee));
    setElementText(profitOtherEl, formatCurrency(other));
    setElementText(profitNetEl, formatCurrency(net));
    setElementText(profitMarginEl, `${margin.toFixed(1)}%`);

    if (profitStatusEl) {
        profitStatusEl.textContent = net >= 0 ? 'Laba' : 'Rugi';
        profitStatusEl.classList.toggle('negative', net < 0);
    }
}

function calculateStockExpense() {
    if (!Array.isArray(rawStockHistory) || rawStockHistory.length === 0) return 0;

    const dateFrom = appliedFilters.dateFrom ? new Date(`${appliedFilters.dateFrom}T00:00:00`) : null;
    const dateTo = appliedFilters.dateTo ? new Date(`${appliedFilters.dateTo}T23:59:59`) : null;

    return rawStockHistory.reduce((sum, row) => {
        const changedAtRaw = row.changed_at || row.changedAt;
        if (!changedAtRaw) return sum;
        const changedAt = new Date(changedAtRaw);
        if (Number.isNaN(changedAt.getTime())) return sum;
        if (dateFrom && changedAt < dateFrom) return sum;
        if (dateTo && changedAt > dateTo) return sum;

        const delta = Number(row.delta ?? (Number(row.quantity_after) - Number(row.quantity_before)));
        if (!Number.isFinite(delta) || delta <= 0) return sum;

        if (!isPurchaseLikeStockChange(row.change_reason)) return sum;

        const rawId = Number(row.raw_material_id ?? row.rawMaterialId ?? row.material_id ?? row.materialId);
        const price = rawMaterialPrices.get(rawId) ?? Number(row.price) ?? 0;
        if (!Number.isFinite(price) || price <= 0) return sum;

        return sum + (delta * price);
    }, 0);
}

function buildRawMaterialPriceMap(rawStocks) {
    const map = new Map();
    if (!Array.isArray(rawStocks)) return map;

    rawStocks.forEach((row) => {
        const rawId = Number(row.raw_material_id ?? row.rawMaterialId ?? row.id);
        const price = Number(row.price ?? row.costPrice ?? 0);
        if (Number.isFinite(rawId) && Number.isFinite(price)) {
            map.set(rawId, price);
        }
    });

    return map;
}

// Product Trend Chart (Top 5) using Chart.js
let _productTrendChart = null;
function renderProductTrendChart(productRows) {
    if (!productRows) return;
    // productRows expected shape from buildProductRows -> uses sortValues and cells
    const normalized = productRows.map((r) => ({
        product_name: (r.sortValues && r.sortValues.name) || (r.cells && r.cells[1]) || 'Unknown',
        qty: Number(r.sortValues?.quantity || 0)
    }));

    const rows = normalized.slice().sort((a, b) => b.qty - a.qty).slice(0, 5);
    const labels = rows.map((r) => String(r.product_name).replace(/<[^>]*>/g, '').trim());
    const data = rows.map((r) => r.qty);

    const canvas = document.getElementById('productTrendChart');
    if (!canvas) return;

    // replace placeholder content if canvas is not an actual <canvas>
    if (canvas.tagName.toLowerCase() !== 'canvas') {
        // try to find inner canvas
        const inner = canvas.querySelector('canvas');
        if (inner) {
            _renderChartOnCanvas(inner, labels, data);
            return;
        }
        // create canvas inside
        canvas.innerHTML = '<canvas id="productTrendChartCanvas" height="260"></canvas>';
        const newCanvas = canvas.querySelector('#productTrendChartCanvas');
        if (newCanvas) {
            _renderChartOnCanvas(newCanvas, labels, data);
        }
        return;
    }

    _renderChartOnCanvas(canvas, labels, data);
}

function _renderChartOnCanvas(ctxEl, labels, data) {
    try {
        if (_productTrendChart) {
            _productTrendChart.data.labels = labels;
            _productTrendChart.data.datasets[0].data = data;
            _productTrendChart.update();
            return;
        }

        _productTrendChart = new Chart(ctxEl.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Unit Terjual',
                    data,
                    backgroundColor: '#6B4423',
                    borderColor: '#51331a',
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {legend: {display: false}},
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
            }
        });
    } catch (err) {
        console.warn('Chart render error', err);
    }
}

function normalizeTransactionItems(items) {
    if (!Array.isArray(items)) return [];

    return items.map((item) => {
        const quantity = Number(item.quantity ?? item.qty ?? 0) || 0;
        const unitPrice = Number(item.unit_price ?? item.price ?? 0) || 0;

        return {
            ...item,
            product_id: Number(item.product_id ?? item.productId ?? 0) || 0,
            product_name: item.product_name || item.productName || 'Produk Tidak Dikenal',
            category: item.category || item.product_category || item.productCategory || '',
            quantity,
            unit_price: unitPrice,
            subtotal: Number(item.subtotal ?? (quantity * unitPrice)) || 0
        };
    }).filter((item) => Number.isFinite(Number(item.quantity)));
}

function getCompletedTransactions(transactionsList) {
    return (Array.isArray(transactionsList) ? transactionsList : []).filter((transaction) => isCompletedTransaction(transaction));
}

function isCompletedTransaction(transaction) {
    return String(transaction?.status || '').toLowerCase() === 'completed';
}

function isPurchaseLikeStockChange(reason) {
    const normalized = String(reason || '').toLowerCase().trim();
    if (!normalized) return true;

    if (normalized.includes('keluar') || normalized.includes('out') || normalized.includes('jual') || normalized.includes('sold')) {
        return false;
    }

    if (normalized.includes('stock out') || normalized.includes('barang keluar') || normalized.includes('pengurangan')) {
        return false;
    }

    return normalized.includes('masuk')
        || normalized.includes('beli')
        || normalized.includes('restock')
        || normalized.includes('purchase')
        || normalized.includes('in')
        || normalized.includes('penambahan')
        || normalized.includes('pembelian')
        || normalized.includes('pemasukan')
        || normalized.includes('manual adjustment');
}

function getFilteredTransactions() {
    const dateFrom = appliedFilters.dateFrom ? new Date(`${appliedFilters.dateFrom}T00:00:00`) : null;
    const dateTo = appliedFilters.dateTo ? new Date(`${appliedFilters.dateTo}T23:59:59`) : null;
    const searchKeyword = (appliedFilters.search || '').toLowerCase();

    return transactions.filter((transaction) => {
        if (dateFrom && transaction.createdAt < dateFrom) return false;
        if (dateTo && transaction.createdAt > dateTo) return false;

        if (appliedFilters.status !== 'all' && transaction.status !== appliedFilters.status) {
            return false;
        }

        if (appliedFilters.payment !== 'all' && transaction.paymentMethod !== appliedFilters.payment) {
            return false;
        }

        if (appliedFilters.category !== 'all') {
            const hasCategory = transaction.items.some((item) => normalizeCategory(item.category) === appliedFilters.category);
            if (!hasCategory) return false;
        }

        if (searchKeyword) {
            const itemNames = transaction.items.map((item) => item.product_name || '').join(' ').toLowerCase();
            const searchBlob = [
                transaction.id,
                transaction.customerName,
                transaction.employeeName,
                transaction.paymentMethod,
                transaction.status,
                itemNames
            ].join(' ').toLowerCase();

            if (!searchBlob.includes(searchKeyword)) {
                return false;
            }
        }

        return true;
    });
}

function buildSalesRows(data) {
    return data.map((transaction) => {
        const itemLabel = transaction.itemCount > 0 ? `${transaction.itemCount} item` : '0 item';

        return {
            id: transaction.id,
            sortValues: {
                id: transaction.id,
                date: transaction.createdAt.getTime(),
                customer: transaction.customerName,
                items: transaction.itemCount,
                amount: transaction.totalAmount,
                payment: transaction.paymentMethod
            },
            cells: [
                `<strong>#${transaction.id}</strong>`,
                `${formatDateTime(transaction.createdAt)}`,
                `${escapeHtml(transaction.customerName)}`,
                `${escapeHtml(itemLabel)}`,
                `${formatCurrency(transaction.totalAmount)}`,
                `${paymentLabel(transaction.paymentMethod)}`,
                `<span class="table-badge ${statusBadgeClass(transaction.status)}">${statusLabel(transaction.status)}</span>`,
                `<div class="table-actions"><button class="table-action-btn view" data-id="${transaction.id}" data-label="Transaksi" title="Lihat"><i class="fas fa-eye"></i></button></div>`
            ]
        };
    });
}

function buildProductRows(data) {
    const productMap = new Map();

    data.forEach((transaction) => {
        transaction.items.forEach((item) => {
            const category = normalizeCategory(item.category);
            if (appliedFilters.category !== 'all' && category !== appliedFilters.category) {
                return;
            }

            const productId = Number(item.product_id) || 0;
            const key = productId || `${item.product_name}-${category}`;

            if (!productMap.has(key)) {
                productMap.set(key, {
                    id: productId || '-',
                    name: item.product_name || 'Produk Tidak Dikenal',
                    category,
                    quantity: 0,
                    amount: 0,
                    transactions: new Set()
                });
            }

            const bucket = productMap.get(key);
            bucket.quantity += Number(item.quantity) || 0;
            bucket.amount += Number(item.subtotal) || 0;
            bucket.transactions.add(transaction.id);
        });
    });

    const totalRevenue = Array.from(productMap.values()).reduce((sum, item) => sum + item.amount, 0);

    return Array.from(productMap.values()).map((product) => {
        const share = totalRevenue > 0 ? (product.amount / totalRevenue) * 100 : 0;
        const statusText = product.quantity >= 20 ? 'Laris' : product.quantity >= 8 ? 'Normal' : 'Rendah';
        const statusClass = product.quantity >= 20 ? 'success' : product.quantity >= 8 ? 'info' : 'warning';

        return {
            id: product.id,
            sortValues: {
                id: String(product.id),
                name: product.name,
                category: product.category,
                quantity: product.quantity,
                amount: product.amount,
                share
            },
            cells: [
                `<strong>${escapeHtml(String(product.id))}</strong>`,
                `${escapeHtml(product.name)}`,
                `${categoryLabel(product.category)}`,
                `${product.quantity}`,
                `${formatCurrency(product.amount)}`,
                `${share.toFixed(1)}%`,
                `<span class="table-badge ${statusClass}">${statusText}</span>`,
                `<div class="table-actions"><button class="table-action-btn view" data-id="${escapeHtml(String(product.id))}" data-label="Produk" title="Lihat"><i class="fas fa-eye"></i></button></div>`
            ]
        };
    });
}

function buildEmployeeRows(data) {
    const employeeMap = new Map();

    data.forEach((transaction) => {
        const employeeKey = transaction.employeeName || 'Tanpa Karyawan';
        if (!employeeMap.has(employeeKey)) {
            employeeMap.set(employeeKey, {
                id: '-',
                name: employeeKey,
                shift: 'N/A',
                transactions: 0,
                amount: 0
            });
        }

        const bucket = employeeMap.get(employeeKey);
        bucket.transactions += 1;
        bucket.amount += transaction.totalAmount;
    });

    return Array.from(employeeMap.values()).map((employee) => {
        const average = employee.transactions > 0 ? employee.amount / employee.transactions : 0;
        const statusText = employee.transactions >= 10 ? 'Aktif' : employee.transactions >= 4 ? 'Normal' : 'Rendah';
        const statusClass = employee.transactions >= 10 ? 'success' : employee.transactions >= 4 ? 'info' : 'warning';

        return {
            id: employee.id,
            sortValues: {
                id: String(employee.id),
                name: employee.name,
                shift: employee.shift,
                transactions: employee.transactions,
                amount: employee.amount,
                average
            },
            cells: [
                `<strong>${escapeHtml(String(employee.id))}</strong>`,
                `${escapeHtml(employee.name)}`,
                `${escapeHtml(employee.shift)}`,
                `${employee.transactions}`,
                `${formatCurrency(employee.amount)}`,
                `${formatCurrency(average)}`,
                `<span class="table-badge ${statusClass}">${statusText}</span>`,
                `<div class="table-actions"><button class="table-action-btn view" data-id="${escapeHtml(String(employee.id))}" data-label="Karyawan" title="Lihat"><i class="fas fa-eye"></i></button></div>`
            ]
        };
    });
}

function sortRows(rows) {
    const sortedRows = [...rows];
    const directionFactor = sortDirection === 'asc' ? 1 : -1;

    sortedRows.sort((a, b) => {
        const aVal = a.sortValues?.[sortColumn];
        const bVal = b.sortValues?.[sortColumn];

        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return (aVal - bVal) * directionFactor;
        }

        return String(aVal).localeCompare(String(bVal), 'id', { sensitivity: 'base' }) * directionFactor;
    });

    return sortedRows;
}

function updateSummaryCards(salesData, productRows, employeeRows) {
    const salesRevenue = salesData.reduce((sum, tx) => sum + tx.totalAmount, 0);
    const salesCount = salesData.length;
    const totalQty = salesData.reduce((sum, tx) => sum + tx.itemCount, 0);
    const salesAvg = salesCount > 0 ? salesRevenue / salesCount : 0;

    if (currentReport === 'products') {
        const totalProductRevenue = productRows.reduce((sum, row) => sum + (Number(row.sortValues.amount) || 0), 0);
        const totalProductQty = productRows.reduce((sum, row) => sum + (Number(row.sortValues.quantity) || 0), 0);
        const productAvg = productRows.length > 0 ? totalProductRevenue / productRows.length : 0;

        setSummaryLabel(0, 'Total Pendapatan Produk');
        setSummaryLabel(1, 'Jumlah Produk');
        setSummaryLabel(2, 'Qty Terjual');
        setSummaryLabel(3, 'Rata-rata per Produk');

        setElementText(totalRevenueEl, formatCurrency(totalProductRevenue));
        setElementText(totalTransactionsEl, formatNumber(productRows.length));
        setElementText(totalProductsSoldEl, formatNumber(totalProductQty));
        setElementText(avgTransactionEl, formatCurrency(productAvg));
        return;
    }

    if (currentReport === 'employees') {
        const totalEmployeeRevenue = employeeRows.reduce((sum, row) => sum + (Number(row.sortValues.amount) || 0), 0);
        const totalEmployeeTransactions = employeeRows.reduce((sum, row) => sum + (Number(row.sortValues.transactions) || 0), 0);
        const employeeAvg = employeeRows.length > 0 ? totalEmployeeRevenue / employeeRows.length : 0;

        setSummaryLabel(0, 'Total Penjualan Tim');
        setSummaryLabel(1, 'Jumlah Karyawan');
        setSummaryLabel(2, 'Total Transaksi');
        setSummaryLabel(3, 'Rata-rata per Karyawan');

        setElementText(totalRevenueEl, formatCurrency(totalEmployeeRevenue));
        setElementText(totalTransactionsEl, formatNumber(employeeRows.length));
        setElementText(totalProductsSoldEl, formatNumber(totalEmployeeTransactions));
        setElementText(avgTransactionEl, formatCurrency(employeeAvg));
        return;
    }

    setSummaryLabel(0, 'Total Pendapatan');
    setSummaryLabel(1, 'Total Transaksi');
    setSummaryLabel(2, 'Produk Terjual');
    setSummaryLabel(3, 'Rata-rata Transaksi');

    setElementText(totalRevenueEl, formatCurrency(salesRevenue));
    setElementText(totalTransactionsEl, formatNumber(salesCount));
    setElementText(totalProductsSoldEl, formatNumber(totalQty));
    setElementText(avgTransactionEl, formatCurrency(salesAvg));
}

function updateReportMeta() {
    const reportMeta = {
        sales: {
            title: '<i class="fas fa-chart-bar"></i> Laporan Penjualan',
            table: '<i class="fas fa-table"></i> Detail Transaksi'
        },
        products: {
            title: '<i class="fas fa-box"></i> Laporan Produk',
            table: '<i class="fas fa-table"></i> Ringkasan Produk'
        },
        employees: {
            title: '<i class="fas fa-user-tie"></i> Laporan Karyawan',
            table: '<i class="fas fa-table"></i> Performa Karyawan'
        }
    };

    const selected = reportMeta[currentReport] || reportMeta.sales;

    if (reportTitleEl) {
        reportTitleEl.innerHTML = selected.title;
    }

    if (tableTitleEl) {
        tableTitleEl.innerHTML = selected.table;
    }

    if (reportPeriodEl) {
        const fromLabel = appliedFilters.dateFrom ? formatDateOnly(appliedFilters.dateFrom) : '-';
        const toLabel = appliedFilters.dateTo ? formatDateOnly(appliedFilters.dateTo) : '-';
        reportPeriodEl.innerHTML = `<i class="fas fa-calendar"></i><span>${fromLabel} - ${toLabel}</span>`;
    }
}

function updateTabBadges(salesCount, productCount, employeeCount) {
    if (badgeSalesEl) badgeSalesEl.textContent = formatNumber(salesCount);
    if (badgeProductsEl) badgeProductsEl.textContent = formatNumber(productCount);
    if (badgeEmployeesEl) badgeEmployeesEl.textContent = formatNumber(employeeCount);
}

function renderTable() {
    const normalizedRows = (Array.isArray(currentRows) ? currentRows : []).filter(isRenderableRow);
    const totalRows = normalizedRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageRows = normalizedRows.slice(startIndex, endIndex);

    if (currentViewMode === 'grid') {
        if (reportTableBody) {
            reportTableBody.innerHTML = '';
        }
        renderGridCards(pageRows);
        if (reportTable) reportTable.style.display = 'none';
        if (reportGridView) reportGridView.style.display = totalRows === 0 ? 'none' : 'grid';
    } else {
        if (reportGridView) {
            reportGridView.style.display = 'none';
            reportGridView.innerHTML = '';
        }

        if (reportTableBody) {
            reportTableBody.innerHTML = pageRows.map((row) => `
                <tr>
                    <td>${row.cells[0]}</td>
                    <td>${row.cells[1]}</td>
                    <td>${row.cells[2]}</td>
                    <td>${row.cells[3]}</td>
                    <td class="currency">${row.cells[4]}</td>
                    <td>${row.cells[5]}</td>
                    <td class="status">${row.cells[6]}</td>
                    <td>${row.cells[7]}</td>
                </tr>
            `).join('');
        }

        if (reportTable) reportTable.style.display = totalRows === 0 ? 'none' : 'table';
    }

    const tableTotal = normalizedRows.reduce((sum, row) => sum + (Number(row.sortValues?.amount) || 0), 0);
    if (tableTotalEl) {
        tableTotalEl.textContent = formatCurrency(tableTotal);
    }

    if (tableEmptyEl) {
        tableEmptyEl.style.display = totalRows === 0 ? 'flex' : 'none';
    }

    if (tablePaginationEl) {
        tablePaginationEl.style.display = totalRows === 0 ? 'none' : 'flex';
    }

    updatePagination(totalRows, totalPages, startIndex, endIndex);
    updateSortableHeaderState();
}

function isRenderableRow(row) {
    return !!(row && Array.isArray(row.cells) && row.cells.length >= 8);
}

function renderGridCards(rows) {
    if (!reportGridView) return;

    if (rows.length === 0) {
        reportGridView.innerHTML = '';
        return;
    }

    reportGridView.innerHTML = rows.map((row) => `
        <article class="report-grid-card">
            <div class="report-grid-card-head">
                <div class="report-grid-title">${row.cells[2]}</div>
                <div class="report-grid-id">${row.cells[0]}</div>
            </div>
            <div class="report-grid-meta">
                <div><span>Tanggal</span><strong>${row.cells[1]}</strong></div>
                <div><span>Item</span><strong>${row.cells[3]}</strong></div>
                <div><span>Total</span><strong class="currency">${row.cells[4]}</strong></div>
                <div><span>Pembayaran</span><strong>${row.cells[5]}</strong></div>
                <div><span>Status</span><strong>${row.cells[6]}</strong></div>
            </div>
            <div class="report-grid-actions">${row.cells[7]}</div>
        </article>
    `).join('');
}

function updatePagination(totalRows, totalPages, startIndex, endIndex) {
    if (paginationInfoEl) {
        if (totalRows === 0) {
            paginationInfoEl.textContent = 'Menampilkan 0 dari 0 data';
        } else {
            paginationInfoEl.textContent = `Menampilkan ${startIndex + 1}-${Math.min(endIndex, totalRows)} dari ${totalRows} data`;
        }
    }

    if (btnPrevPage) {
        btnPrevPage.disabled = currentPage <= 1;
    }

    if (btnNextPage) {
        btnNextPage.disabled = currentPage >= totalPages || totalRows === 0;
    }

    if (!paginationButtonsEl) return;

    if (totalRows === 0) {
        paginationButtonsEl.innerHTML = '';
        return;
    }

    const pageButtons = [];
    for (let page = 1; page <= totalPages; page += 1) {
        pageButtons.push(`<button class="pagination-btn ${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`);
    }

    paginationButtonsEl.innerHTML = pageButtons.join('');
}

function updateSortableHeaderState() {
    tableHeaderCells.forEach((header) => {
        header.classList.remove('sorted-asc', 'sorted-desc');

        const column = header.getAttribute('data-sort');
        if (!column || column !== sortColumn) return;

        header.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
    });
}

function changePage(nextPage) {
    const totalPages = Math.max(1, Math.ceil(currentRows.length / pageSize));
    if (nextPage < 1 || nextPage > totalPages) return;

    currentPage = nextPage;
    renderTable();
}

function showLoading(isLoading) {
    if (tableLoadingEl) {
        tableLoadingEl.style.display = isLoading ? 'flex' : 'none';
    }

    if (reportTable) {
        reportTable.style.opacity = isLoading ? '0.5' : '1';
    }
}

// ============================================
// EXPORT & PRINT
// ============================================

function handlePrintReport() {
    openPrintWindow('print');
}

async function handleExportPdf() {
    const titleText = reportTitleEl ? reportTitleEl.textContent.trim() : 'Laporan';
    const periodText = reportPeriodEl ? reportPeriodEl.textContent.replace(/\s+/g, ' ').trim() : '-';
    const headers = getTableHeaders();
    const bodyRows = getTableRows();

    try {
        const JsPdf = await ensureJsPdfLoaded();
        const pdf = new JsPdf({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text(titleText, 40, 40);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(`Periode: ${periodText}`, 40, 58);
        pdf.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 40, 74);

        let currentY = 100;

        if (headers.length > 0) {
            const headerLine = headers.join(' | ');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            const wrappedHeaders = pdf.splitTextToSize(headerLine, 760);
            pdf.text(wrappedHeaders, 40, currentY);
            currentY += (wrappedHeaders.length * 12) + 6;
        }

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);

        if (bodyRows.length === 0) {
            pdf.text('Tidak ada data transaksi untuk ditampilkan.', 40, currentY);
        } else {
            bodyRows.forEach((row) => {
                const rowLine = row.join(' | ');
                const wrappedRow = pdf.splitTextToSize(rowLine, 760);

                if (currentY > 530) {
                    pdf.addPage();
                    currentY = 40;
                }

                pdf.text(wrappedRow, 40, currentY);
                currentY += (wrappedRow.length * 11) + 4;
            });
        }

        if (tableTotalEl && tableTotalEl.textContent.trim()) {
            if (currentY > 560) {
                pdf.addPage();
                currentY = 40;
            }

            pdf.setFont('helvetica', 'bold');
            pdf.text(`Total: ${tableTotalEl.textContent.trim()}`, 40, currentY + 8);
        }

        pdf.save(`laporan-${generateFileDate()}.pdf`);
        showReportMessage('Export PDF berhasil.', 'success');
    } catch (error) {
        console.error('Export PDF error:', error);
        showReportMessage('Export PDF menggunakan mode print karena library PDF tidak tersedia.', 'warning');
        openPrintWindow('pdf');
    }
}

function handleExportExcel() {
    if (!reportTable) {
        showReportMessage('Tabel laporan tidak ditemukan.', 'error');
        return;
    }

    const htmlContent = buildExcelDocument();
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const filename = `laporan-${generateFileDate()}.xls`;
    downloadBlob(blob, filename);
    showReportMessage('Export Excel berhasil.', 'success');
}

function handleExportCsv() {
    if (!reportTable) {
        showReportMessage('Tabel laporan tidak ditemukan.', 'error');
        return;
    }

    const csvRows = [];
    const headers = getTableHeaders();
    const bodyRows = getTableRows();

    if (headers.length > 0) {
        csvRows.push(convertToCsvRow(headers));
    }

    bodyRows.forEach((row) => {
        csvRows.push(convertToCsvRow(row));
    });

    if (tableTotalEl) {
        csvRows.push(convertToCsvRow(['', '', '', 'Total', tableTotalEl.textContent.trim(), '', '', '']));
    }

    const csvContent = `\uFEFF${csvRows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `laporan-${generateFileDate()}.csv`;
    downloadBlob(blob, filename);
    showReportMessage('Export CSV berhasil.', 'success');
}

function openPrintWindow(mode) {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
        showReportMessage('Pop-up diblokir browser. Izinkan pop-up untuk print/export PDF.', 'error');
        return;
    }

    const html = buildPrintableDocument(mode);
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();

        if (mode === 'pdf') {
            showReportMessage('Dialog print terbuka. Pilih "Save as PDF" untuk menyimpan file PDF.', 'info');
        }
    };
}

function buildPrintableDocument(mode) {
    const titleText = reportTitleEl ? reportTitleEl.textContent.trim() : 'Laporan';
    const periodText = reportPeriodEl ? reportPeriodEl.textContent.replace(/\s+/g, ' ').trim() : '-';
    const tableHtml = reportTable ? reportTable.outerHTML : '<p>Tabel laporan tidak tersedia.</p>';
    const generatedAt = new Date().toLocaleString('id-ID');
    const printHeading = mode === 'pdf' ? 'Export PDF Laporan' : 'Print View Laporan';

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(titleText)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 24px;
            color: #1e293b;
        }
        .report-print-header {
            margin-bottom: 16px;
        }
        .report-print-title {
            font-size: 24px;
            margin: 0 0 4px;
        }
        .report-print-subtitle {
            font-size: 14px;
            color: #475569;
            margin: 0;
        }
        .report-print-meta {
            margin: 16px 0;
            font-size: 12px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        th,
        td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #f1f5f9;
            font-weight: 700;
        }
        tfoot td {
            background: #f8fafc;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <header class="report-print-header">
        <h1 class="report-print-title">${escapeHtml(titleText)}</h1>
        <p class="report-print-subtitle">${escapeHtml(periodText)}</p>
    </header>
    <div class="report-print-meta">
        <span>${escapeHtml(printHeading)}</span>
        <span>Dibuat: ${escapeHtml(generatedAt)}</span>
    </div>
    ${tableHtml}
</body>
</html>`;
}

function buildExcelDocument() {
    const titleText = reportTitleEl ? reportTitleEl.textContent.trim() : 'Laporan';
    const periodText = reportPeriodEl ? reportPeriodEl.textContent.replace(/\s+/g, ' ').trim() : '-';
    const tableHtml = reportTable ? reportTable.outerHTML : '';

    return `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; }
        h2 { margin-bottom: 4px; }
        p { margin-top: 0; color: #475569; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; }
        th { background: #f1f5f9; }
    </style>
</head>
<body>
    <h2>${escapeHtml(titleText)}</h2>
    <p>${escapeHtml(periodText)}</p>
    ${tableHtml}
</body>
</html>`;
}

function getTableHeaders() {
    if (!reportTable) return [];

    const headerElements = reportTable.querySelectorAll('thead th');
    return Array.from(headerElements).map((header) => header.textContent.trim());
}

function getTableRows() {
    if (!reportTable) return [];

    const sourceRows = reportTableBody && reportTableBody.querySelectorAll('tr').length > 0
        ? reportTableBody.querySelectorAll('tr')
        : reportTable.querySelectorAll('tbody tr');

    return Array.from(sourceRows)
        .map((row) => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).map((cell) => cell.textContent.replace(/\s+/g, ' ').trim());
        })
        .filter((row) => row.length > 0 && row.some((cell) => cell !== ''));
}

function convertToCsvRow(rowData) {
    return rowData
        .map((value) => {
            const safeValue = (value ?? '').toString();
            const escaped = safeValue.replace(/"/g, '""');
            return `"${escaped}"`;
        })
        .join(',');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function ensureJsPdfLoaded() {
    return new Promise((resolve, reject) => {
        if (window.jspdf && window.jspdf.jsPDF) {
            resolve(window.jspdf.jsPDF);
            return;
        }

        const existingScript = document.querySelector('script[data-lib="jspdf"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                if (window.jspdf && window.jspdf.jsPDF) {
                    resolve(window.jspdf.jsPDF);
                } else {
                    reject(new Error('jsPDF loaded but unavailable in window scope'));
                }
            });
            existingScript.addEventListener('error', () => reject(new Error('Failed to load jsPDF script')));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        script.setAttribute('data-lib', 'jspdf');
        script.onload = () => {
            if (window.jspdf && window.jspdf.jsPDF) {
                resolve(window.jspdf.jsPDF);
                return;
            }

            reject(new Error('jsPDF loaded but unavailable in window scope'));
        };
        script.onerror = () => reject(new Error('Failed to load jsPDF script'));
        document.head.appendChild(script);
    });
}

// ============================================
// COMMON HELPERS
// ============================================

function parseDateSafe(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeStatus(value) {
    const normalized = String(value || 'completed').toLowerCase();

    if (normalized === 'selesai') return 'completed';
    if (normalized === 'dibatalkan') return 'cancelled';
    if (normalized === 'menunggu') return 'pending';

    if (['completed', 'pending', 'cancelled'].includes(normalized)) {
        return normalized;
    }

    return 'completed';
}

function normalizePayment(value) {
    const normalized = String(value || 'cash').toLowerCase();

    if (normalized.includes('debit')) return 'debit';
    if (normalized.includes('credit') || normalized.includes('kredit')) return 'credit';
    if (normalized.includes('wallet') || normalized.includes('qris')) return 'ewallet';
    return 'cash';
}

function normalizeCategory(value) {
    const normalized = String(value || '').trim().toLowerCase();

    if (!normalized) return 'other';
    if ((normalized.includes('non') && normalized.includes('kopi')) || normalized.includes('non-coffee')) return 'non-coffee';
    if (normalized.includes('coffee') || normalized.includes('kopi')) return 'coffee';
    if (normalized.includes('food') || normalized.includes('makanan')) return 'food';
    if (normalized.includes('snack')) return 'snack';

    return normalized;
}

function categoryLabel(category) {
    const labels = {
        coffee: 'Kopi',
        'non-coffee': 'Non-Kopi',
        food: 'Makanan',
        snack: 'Snack'
    };

    return labels[category] || category;
}

function paymentLabel(payment) {
    const labels = {
        cash: 'Tunai',
        debit: 'Kartu Debit',
        credit: 'Kartu Kredit',
        ewallet: 'E-Wallet'
    };

    return labels[payment] || payment;
}

function statusLabel(status) {
    const labels = {
        completed: 'Selesai',
        pending: 'Pending',
        cancelled: 'Dibatalkan'
    };

    return labels[status] || status;
}

function statusBadgeClass(status) {
    if (status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'cancelled') return 'danger';
    return 'info';
}

function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(Number(value) || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function formatDateTime(date) {
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateOnly(dateStr) {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function setSummaryLabel(index, text) {
    if (!summaryLabels[index]) return;
    summaryLabels[index].textContent = text;
}

function setElementText(element, text) {
    if (!element) return;
    element.textContent = text;
}

function generateFileDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${date}-${hours}${minutes}`;
}

function escapeHtml(value) {
    if (!value) return '';

    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showReportMessage(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    if (type === 'error' || type === 'warning') {
        alert(message);
        return;
    }

    console.log(message);
}
