let products = [];
let discounts = [];
let filteredDiscounts = [];

const discountModal = document.getElementById('discountModal');
const discountForm = document.getElementById('discountForm');
const discountTableBody = document.getElementById('discountTableBody');
const productSelect = document.getElementById('productId');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');

function getProductsApi() {
  if (window.API && window.API.Products && typeof window.API.Products.getAll === 'function') {
    return window.API.Products;
  }
  return {
    getAll: () => window.API.apiFetch('/products')
  };
}

function getDiscountsApi() {
  if (window.API && window.API.Discounts) {
    return window.API.Discounts;
  }
  return {
    getAll: () => window.API.apiFetch('/discounts'),
    create: (data) => window.API.apiFetch('/discounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => window.API.apiFetch(`/discounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => window.API.apiFetch(`/discounts/${id}`, { method: 'DELETE' })
  };
}

function formatRupiahLocal(amount) {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

function toInputDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toDateLabel(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatus(discount) {
  const now = Date.now();
  const start = discount.start_date ? new Date(discount.start_date).getTime() : null;
  const end = discount.end_date ? new Date(discount.end_date).getTime() : null;

  if (Number(discount.is_active) !== 1) {
    return { key: 'inactive', label: 'Nonaktif' };
  }

  if (start && now < start) {
    return { key: 'upcoming', label: 'Akan Datang' };
  }

  if (end && now > end) {
    return { key: 'ended', label: 'Berakhir' };
  }

  return { key: 'active', label: 'Aktif' };
}

function renderProductOptions() {
  if (!productSelect) return;

  // Filter hanya produk yang ada di menu POS (is_menu = 1)
  const menuProducts = products.filter(p => Number(p.is_menu) === 1);
  
  const options = menuProducts.map((product) => {
    const text = `${product.name} (${formatRupiahLocal(product.price)})`;
    return `<option value="${product.id}">${text}</option>`;
  });

  productSelect.innerHTML = options.length > 0
    ? `<option value="">Pilih produk</option>${options.join('')}`
    : '<option value="">Produk menu tidak tersedia</option>';
}

function updateStats() {
  const total = discounts.length;
  const active = discounts.filter((item) => getStatus(item).key === 'active').length;
  const upcoming = discounts.filter((item) => getStatus(item).key === 'upcoming').length;
  const ended = discounts.filter((item) => getStatus(item).key === 'ended').length;

  document.getElementById('totalDiscounts').textContent = String(total);
  document.getElementById('activeDiscounts').textContent = String(active);
  document.getElementById('upcomingDiscounts').textContent = String(upcoming);
  document.getElementById('endedDiscounts').textContent = String(ended);
}

function applyFilters() {
  const search = String(searchInput.value || '').toLowerCase().trim();
  const status = statusFilter.value;

  filteredDiscounts = discounts.filter((item) => {
    const itemStatus = getStatus(item).key;
    const matchName = String(item.product_name || '').toLowerCase().includes(search);
    const matchStatus = status === 'all' || itemStatus === status;
    return matchName && matchStatus;
  });

  renderTable();
}

function renderTable() {
  if (!filteredDiscounts.length) {
    discountTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">Belum ada diskon yang cocok dengan filter.</td></tr>';
    return;
  }

  discountTableBody.innerHTML = filteredDiscounts.map((item) => {
    const status = getStatus(item);
    const discountLabel = item.discount_type === 'percentage'
      ? `${item.discount_value}%`
      : formatRupiahLocal(item.discount_value);

    return `
      <tr>
        <td>${item.product_name}</td>
        <td>${formatRupiahLocal(item.product_price)}</td>
        <td>${discountLabel}</td>
        <td>${formatRupiahLocal(item.discounted_price)}</td>
        <td>${toDateLabel(item.start_date)} - ${toDateLabel(item.end_date)}</td>
        <td><span class="discount-badge ${status.key}">${status.label}</span></td>
        <td>
          <button class="action-btn edit" onclick="openEditModal(${item.id})" title="Edit">
            <i class="fas fa-pen"></i>
          </button>
          <button class="action-btn delete" onclick="deleteDiscount(${item.id})" title="Hapus">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadInitialData() {
  try {
    const productsApi = getProductsApi();
    const discountsApi = getDiscountsApi();
    const [productsRes, discountsRes] = await Promise.all([
      productsApi.getAll(),
      discountsApi.getAll()
    ]);

    products = Array.isArray(productsRes) ? productsRes : [];
    discounts = Array.isArray(discountsRes) ? discountsRes : [];

    renderProductOptions();
    updateStats();
    applyFilters();
  } catch (error) {
    discountTableBody.innerHTML = `<tr><td colspan="7" class="table-empty">Gagal memuat data: ${error.message}</td></tr>`;
    if (typeof showNotification === 'function') {
      showNotification('Gagal memuat data diskon', 'error');
    }
  }
}

function resetForm() {
  document.getElementById('discountId').value = '';
  document.getElementById('modalTitle').textContent = 'Tambah Diskon Produk';
  document.getElementById('productId').value = '';
  document.getElementById('discountType').value = 'percentage';
  document.getElementById('discountValue').value = '';
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('isActive').checked = true;
}

function openModal() {
  resetForm();
  discountModal.classList.add('show');
}

function closeModal() {
  discountModal.classList.remove('show');
}

window.openEditModal = function openEditModal(id) {
  const item = discounts.find((discount) => Number(discount.id) === Number(id));
  if (!item) return;

  document.getElementById('discountId').value = String(item.id);
  document.getElementById('modalTitle').textContent = 'Edit Diskon Produk';
  document.getElementById('productId').value = String(item.product_id);
  document.getElementById('discountType').value = item.discount_type;
  document.getElementById('discountValue').value = String(item.discount_value);
  document.getElementById('startDate').value = toInputDateTime(item.start_date);
  document.getElementById('endDate').value = toInputDateTime(item.end_date);
  document.getElementById('notes').value = item.notes || '';
  document.getElementById('isActive').checked = Number(item.is_active) === 1;

  discountModal.classList.add('show');
};

window.deleteDiscount = async function deleteDiscount(id) {
  const confirmed = window.confirm('Hapus diskon ini?');
  if (!confirmed) return;

  try {
    await getDiscountsApi().delete(id);
    if (typeof showNotification === 'function') {
      showNotification('Diskon berhasil dihapus', 'success');
    }
    await loadInitialData();
  } catch (error) {
    if (typeof showNotification === 'function') {
      showNotification(error.message || 'Gagal menghapus diskon', 'error');
    }
  }
};

async function handleSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('discountId').value;
  const payload = {
    product_id: Number(document.getElementById('productId').value),
    discount_type: document.getElementById('discountType').value,
    discount_value: Number(document.getElementById('discountValue').value),
    start_date: document.getElementById('startDate').value || null,
    end_date: document.getElementById('endDate').value || null,
    notes: document.getElementById('notes').value.trim() || null,
    is_active: document.getElementById('isActive').checked
  };

  if (!payload.product_id) {
    if (typeof showNotification === 'function') {
      showNotification('Pilih produk terlebih dahulu', 'error');
    }
    return;
  }

  try {
    const discountsApi = getDiscountsApi();
    if (id) {
      await discountsApi.update(id, payload);
      if (typeof showNotification === 'function') {
        showNotification('Diskon berhasil diperbarui', 'success');
      }
    } else {
      await discountsApi.create(payload);
      if (typeof showNotification === 'function') {
        showNotification('Diskon berhasil ditambahkan', 'success');
      }
    }

    closeModal();
    await loadInitialData();
  } catch (error) {
    if (typeof showNotification === 'function') {
      showNotification(error.message || 'Gagal menyimpan diskon', 'error');
    }
  }
}

function bindEvents() {
  document.getElementById('addDiscountBtn').addEventListener('click', openModal);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  discountModal.addEventListener('click', (event) => {
    if (event.target === discountModal) {
      closeModal();
    }
  });
  discountForm.addEventListener('submit', handleSubmit);
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
}

document.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  await loadInitialData();
});
