/**
 * Customer Management JavaScript
 * Handles all customer-related operations
 */

// ============================================
// STATE MANAGEMENT
// ============================================

let customers = [];
let filteredCustomers = [];
let currentPage = 1;
let pageSize = 10;
let sortColumn = 'name';
let sortDirection = 'asc';
let currentTab = 'all';
let currentFilter = {
    search: '',
    type: 'all',
    status: 'all'
};

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

// Modal Elements
const modal = document.getElementById('customerModal');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');

// Form Elements
const customerForm = document.getElementById('customerForm');
const customerId = document.getElementById('customerId');
const customerName = document.getElementById('customerName');
const customerPhone = document.getElementById('customerPhone');
const customerEmail = document.getElementById('customerEmail');
const customerAddress = document.getElementById('customerAddress');
const customerType = document.getElementById('customerType');

// Stats Elements
const totalCustomersEl = document.getElementById('totalCustomers');
const regularCustomersEl = document.getElementById('regularCustomers');
const vipCustomersEl = document.getElementById('vipCustomers');
const newCustomersEl = document.getElementById('newCustomers');

// Filter Elements
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');

// Tab Elements
const tabItems = document.querySelectorAll('.tab-item');
const badgeAll = document.getElementById('badgeAll');
const badgeRegular = document.getElementById('badgeRegular');
const badgeVip = document.getElementById('badgeVip');
const badgeNew = document.getElementById('badgeNew');

// Table Elements
const customerTableBody = document.getElementById('customerTableBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const resultsInfo = document.getElementById('resultsInfo');

// Pagination Elements
const paginationContainer = document.getElementById('paginationContainer');
const paginationInfo = document.getElementById('paginationInfo');
const paginationButtons = document.getElementById('paginationButtons');
const btnPrevPage = document.getElementById('btnPrevPage');
const btnNextPage = document.getElementById('btnNextPage');
const pageSizeSelect = document.getElementById('pageSizeSelect');

// Action Elements
const addCustomerBtn = document.getElementById('addCustomerBtn');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadCustomers();
});

function initializeEventListeners() {
    // Modal Events
    addCustomerBtn.addEventListener('click', () => openAddModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveCustomer);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Search & Filter Events
    searchInput.addEventListener('input', handleSearchChange);
    filterType.addEventListener('change', handleFilterChange);
    filterStatus.addEventListener('change', handleFilterChange);

    // Tab Events
    tabItems.forEach(tab => {
        tab.addEventListener('click', () => handleTabChange(tab));
    });

    // Pagination Events
    btnPrevPage.addEventListener('click', () => changePage(currentPage - 1));
    btnNextPage.addEventListener('click', () => changePage(currentPage + 1));
    pageSizeSelect.addEventListener('change', handlePageSizeChange);

    // Customer Type Selector
    const typeOptions = document.querySelectorAll('.type-option');
    typeOptions.forEach(option => {
        option.addEventListener('click', () => {
            typeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            customerType.value = option.getAttribute('data-type');
        });
    });

    // Table Sorting
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => handleSort(header));
    });

    // View Toggle
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Future: Switch between table and grid view
        });
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadCustomers() {
    try {
        showLoading(true);
        
        // Load customers from API
        const response = await window.API.Customers.getAll();
        customers = response.map(customer => ({
            id: customer.id,
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            type: customer.type || 'regular',
            totalPurchases: customer.total_transactions || 0,
            totalAmount: customer.total_amount || 0,
            lastPurchase: customer.last_purchase_date || null,
            isNew: isNewCustomer(customer.created_at),
            status: customer.status || 'active',
            createdAt: customer.created_at
        }));

        applyFiltersAndRender();
        updateStats();
        showLoading(false);
    } catch (error) {
        console.error('Error loading customers:', error);
        showError('Gagal memuat data pelanggan');
        showLoading(false);
    }
}

function isNewCustomer(createdAt) {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Consider new if created within 30 days
}

// ============================================
// FILTERING & SEARCHING
// ============================================

function applyFiltersAndRender() {
    // Apply all filters
    filteredCustomers = customers.filter(customer => {
        // Tab filter
        if (currentTab === 'regular' && customer.type !== 'regular') return false;
        if (currentTab === 'vip' && customer.type !== 'vip') return false;
        if (currentTab === 'new' && !customer.isNew) return false;

        // Type filter
        if (currentFilter.type !== 'all' && customer.type !== currentFilter.type) return false;

        // Status filter
        if (currentFilter.status !== 'all' && customer.status !== currentFilter.status) return false;

        // Search filter
        if (currentFilter.search) {
            const search = currentFilter.search.toLowerCase();
            const matchName = customer.name.toLowerCase().includes(search);
            const matchPhone = customer.phone.toLowerCase().includes(search);
            const matchEmail = customer.email.toLowerCase().includes(search);
            if (!matchName && !matchPhone && !matchEmail) return false;
        }

        return true;
    });

    // Apply sorting
    applySorting();

    // Reset to page 1 when filters change
    currentPage = 1;

    // Render results
    renderCustomers();
    updatePagination();
    updateBadges();
}

function applySorting() {
    filteredCustomers.sort((a, b) => {
        let aVal, bVal;

        switch (sortColumn) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'phone':
                aVal = a.phone;
                bVal = b.phone;
                break;
            case 'purchases':
                aVal = a.totalPurchases;
                bVal = b.totalPurchases;
                break;
            case 'lastPurchase':
                aVal = a.lastPurchase ? new Date(a.lastPurchase).getTime() : 0;
                bVal = b.lastPurchase ? new Date(b.lastPurchase).getTime() : 0;
                break;
            default:
                aVal = a.name;
                bVal = b.name;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

function handleSearchChange(e) {
    currentFilter.search = e.target.value.trim();
    applyFiltersAndRender();
}

function handleFilterChange() {
    currentFilter.type = filterType.value;
    currentFilter.status = filterStatus.value;
    applyFiltersAndRender();
}

function handleTabChange(tab) {
    tabItems.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.getAttribute('data-tab');
    applyFiltersAndRender();
}

function handleSort(header) {
    const column = header.getAttribute('data-sort');
    
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    // Update header classes
    document.querySelectorAll('.sortable').forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
    });
    header.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');

    applySorting();
    renderCustomers();
}

// ============================================
// RENDERING
// ============================================

function renderCustomers() {
    if (filteredCustomers.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    // Calculate pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredCustomers.length);
    const pageCustomers = filteredCustomers.slice(startIndex, endIndex);

    // Update results info
    resultsInfo.textContent = `Menampilkan ${filteredCustomers.length} pelanggan`;

    // Render table rows
    customerTableBody.innerHTML = pageCustomers.map(customer => {
        return createCustomerRow(customer);
    }).join('');

    // Attach event listeners to action buttons
    attachActionListeners();
}

function createCustomerRow(customer) {
    const initials = getInitials(customer.name);
    const badgeHTML = getBadgeHTML(customer);
    const lastPurchaseHTML = getLastPurchaseHTML(customer.lastPurchase);
    const statusHTML = getStatusHTML(customer.status);

    return `
        <tr data-customer-id="${customer.id}">
            <td>
                <div class="customer-info">
                    <div class="customer-avatar">
                        ${initials}
                    </div>
                    <div class="customer-details">
                        <div class="customer-name">
                            <span class="customer-name-text">${customer.name}</span>
                            ${badgeHTML}
                        </div>
                        <div class="customer-email">${customer.email || '-'}</div>
                    </div>
                </div>
            </td>
            <td class="hide-mobile">
                <div class="customer-phone">
                    <i class="fas fa-phone"></i>
                    ${customer.phone || '-'}
                </div>
            </td>
            <td>
                <div class="customer-purchases">
                    <span class="purchases-amount">${customer.totalPurchases}</span>
                    <span class="purchases-total">Rp ${formatCurrency(customer.totalAmount)}</span>
                </div>
            </td>
            <td class="hide-mobile">
                ${lastPurchaseHTML}
            </td>
            <td class="hide-mobile">
                ${statusHTML}
            </td>
            <td>
                <div class="customer-actions">
                    <button class="btn-action view" data-action="view" data-id="${customer.id}" title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" data-action="edit" data-id="${customer.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" data-action="delete" data-id="${customer.id}" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function getBadgeHTML(customer) {
    const badges = [];
    if (customer.type === 'vip') {
        badges.push('<span class="customer-badge vip">VIP</span>');
    }
    if (customer.type === 'regular') {
        badges.push('<span class="customer-badge regular">REGULAR</span>');
    }
    if (customer.isNew) {
        badges.push('<span class="customer-badge new">BARU</span>');
    }
    return badges.join(' ');
}

function getLastPurchaseHTML(lastPurchase) {
    if (!lastPurchase) {
        return '<div class="last-purchase">Belum ada pembelian</div>';
    }
    const date = new Date(lastPurchase);
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);
    return `
        <div class="last-purchase">
            <span class="purchase-date">${formattedDate}</span>
            <span class="purchase-time">${formattedTime}</span>
        </div>
    `;
}

function getStatusHTML(status) {
    const statusClass = status === 'active' ? 'active' : 'inactive';
    const statusText = status === 'active' ? 'Aktif' : 'Tidak Aktif';
    return `<span class="status-badge ${statusClass}">${statusText}</span>`;
}

// ============================================
// PAGINATION
// ============================================

function updatePagination() {
    const totalPages = Math.ceil(filteredCustomers.length / pageSize);
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';

    // Update pagination info
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, filteredCustomers.length);
    paginationInfo.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${filteredCustomers.length} pelanggan`;

    // Update prev/next buttons
    btnPrevPage.disabled = currentPage === 1;
    btnNextPage.disabled = currentPage === totalPages;

    // Generate page buttons
    paginationButtons.innerHTML = generatePageButtons(currentPage, totalPages);

    // Attach click events to page buttons
    paginationButtons.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.getAttribute('data-page'));
            changePage(page);
        });
    });
}

function generatePageButtons(current, total) {
    const buttons = [];
    const maxVisible = 5;

    if (total <= maxVisible) {
        for (let i = 1; i <= total; i++) {
            buttons.push(createPageButton(i, current));
        }
    } else {
        buttons.push(createPageButton(1, current));

        if (current > 3) {
            buttons.push('<span class="pagination-dots">...</span>');
        }

        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);

        for (let i = start; i <= end; i++) {
            buttons.push(createPageButton(i, current));
        }

        if (current < total - 2) {
            buttons.push('<span class="pagination-dots">...</span>');
        }

        buttons.push(createPageButton(total, current));
    }

    return buttons.join('');
}

function createPageButton(page, current) {
    const active = page === current ? 'active' : '';
    return `<button class="pagination-btn ${active}" data-page="${page}">${page}</button>`;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredCustomers.length / pageSize);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderCustomers();
    updatePagination();
}

function handlePageSizeChange(e) {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderCustomers();
    updatePagination();
}

// ============================================
// STATS & BADGES
// ============================================

function updateStats() {
    const total = customers.length;
    const regular = customers.filter(c => c.type === 'regular').length;
    const vip = customers.filter(c => c.type === 'vip').length;
    const newCustomers = customers.filter(c => c.isNew).length;

    totalCustomersEl.textContent = total;
    regularCustomersEl.textContent = regular;
    vipCustomersEl.textContent = vip;
    newCustomersEl.textContent = newCustomers;
}

function updateBadges() {
    const all = filteredCustomers.length;
    const regular = customers.filter(c => c.type === 'regular').length;
    const vip = customers.filter(c => c.type === 'vip').length;
    const newCustomers = customers.filter(c => c.isNew).length;

    badgeAll.textContent = customers.length;
    badgeRegular.textContent = regular;
    badgeVip.textContent = vip;
    badgeNew.textContent = newCustomers;
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function openAddModal() {
    modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Tambah Pelanggan';
    resetForm();
    modal.classList.add('active');
}

function openEditModal(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Pelanggan';
    
    customerId.value = customer.id;
    customerName.value = customer.name;
    customerPhone.value = customer.phone;
    customerEmail.value = customer.email;
    customerAddress.value = customer.address;
    customerType.value = customer.type;

    // Update type selector
    document.querySelectorAll('.type-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-type') === customer.type) {
            opt.classList.add('selected');
        }
    });

    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    resetForm();
}

function resetForm() {
    customerForm.reset();
    customerId.value = '';
    customerType.value = 'regular';
    
    // Reset type selector to regular
    document.querySelectorAll('.type-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-type') === 'regular') {
            opt.classList.add('selected');
        }
    });

    // Clear validation states
    document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
        input.classList.remove('error', 'success');
    });
}

// ============================================
// CRUD OPERATIONS
// ============================================

async function saveCustomer() {
    // Validate form
    if (!validateForm()) {
        return;
    }

    const id = customerId.value;
    const data = {
        name: customerName.value.trim(),
        phone: customerPhone.value.trim(),
        email: customerEmail.value.trim(),
        address: customerAddress.value.trim(),
        type: customerType.value
    };

    try {
        saveBtn.classList.add('loading');
        saveBtn.disabled = true;

        if (id) {
            // Update existing customer
            await window.API.Customers.update(parseInt(id), data);
            showNotification('Pelanggan berhasil diperbarui', 'success');
        } else {
            // Create new customer
            await window.API.Customers.create(data);
            showNotification('Pelanggan berhasil ditambahkan', 'success');
        }

        closeModal();
        await loadCustomers();
    } catch (error) {
        console.error('Error saving customer:', error);
        showNotification('Gagal menyimpan pelanggan: ' + error.message, 'error');
    } finally {
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
    }
}

async function deleteCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const confirmed = confirm(`Apakah Anda yakin ingin menghapus pelanggan "${customer.name}"?\n\nTindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;

    try {
        await window.API.Customers.delete(id);
        showNotification(`${customer.name} berhasil dihapus`, 'success');
        await loadCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
        showNotification('Gagal menghapus pelanggan: ' + error.message, 'error');
    }
}

// ============================================
// FORM VALIDATION
// ============================================

function validateForm() {
    let isValid = true;

    // Validate name
    if (!customerName.value.trim()) {
        setFieldError(customerName, 'Nama wajib diisi');
        isValid = false;
    } else {
        setFieldSuccess(customerName);
    }

    // Validate phone
    if (!customerPhone.value.trim()) {
        setFieldError(customerPhone, 'Nomor telepon wajib diisi');
        isValid = false;
    } else {
        setFieldSuccess(customerPhone);
    }

    // Validate email if provided
    if (customerEmail.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail.value.trim())) {
            setFieldError(customerEmail, 'Format email tidak valid');
            isValid = false;
        } else {
            setFieldSuccess(customerEmail);
        }
    } else {
        customerEmail.classList.remove('error', 'success');
    }

    return isValid;
}

function setFieldError(field, message) {
    field.classList.add('error');
    field.classList.remove('success');
    const errorEl = field.parentElement.nextElementSibling;
    if (errorEl && errorEl.classList.contains('form-error')) {
        errorEl.textContent = message;
    }
}

function setFieldSuccess(field) {
    field.classList.remove('error');
    field.classList.add('success');
}

// ============================================
// EVENT HANDLERS
// ============================================

function attachActionListeners() {
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const id = parseInt(btn.getAttribute('data-id'));

            switch (action) {
                case 'view':
                    viewCustomerDetails(id);
                    break;
                case 'edit':
                    openEditModal(id);
                    break;
                case 'delete':
                    deleteCustomer(id);
                    break;
            }
        });
    });
}

function viewCustomerDetails(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    // Future: Open customer details view/modal
    console.log('View customer:', customer);
    alert(`Detail Pelanggan:\n\nNama: ${customer.name}\nTelepon: ${customer.phone}\nEmail: ${customer.email}\nTipe: ${customer.type.toUpperCase()}\nTotal Pembelian: ${customer.totalPurchases}`);
}

// ============================================
// UI HELPERS
// ============================================

function showLoading(show) {
    if (show) {
        loadingState.style.display = 'flex';
        customerTableBody.innerHTML = '';
        emptyState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
    }
}

function showEmptyState() {
    customerTableBody.innerHTML = '';
    emptyState.style.display = 'block';
    paginationContainer.style.display = 'none';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
}

function showError(message) {
    customerTableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: #dc2626;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px;"></i>
                <div>${message}</div>
            </td>
        </tr>
    `;
}

function showNotification(message, type = 'success') {
    // Use browser notification if available
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}

function formatDate(date) {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
}

function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
}
