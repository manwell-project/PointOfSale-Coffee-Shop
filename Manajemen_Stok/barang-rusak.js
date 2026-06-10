/**
 * Barang Rusak & Kadaluarsa
 */

let tableData = [];
let currentFilters = { search: '', type: '' };

const historyTableBody = document.getElementById('historyTableBody');
const searchInput = document.getElementById('searchHistoryInput');
const typeFilter = document.getElementById('typeFilter');
const showingText = document.getElementById('historyShowingText');

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text ?? '').replace(/[&<>"']/g, (m) => map[m]);
}

function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
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

function formatDateOnly(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

function filterRows(rows) {
  const search = (currentFilters.search || '').trim().toLowerCase();
  const type = currentFilters.type || '';

  return rows.filter((r) => {
    if (type && r.type !== type) return false;

    if (search) {
      const materialName = String(r.productName || '').toLowerCase();
      const reason = String(r.reason || '').toLowerCase();
      const employeeName = String(r.employee || '').toLowerCase();
      if (!materialName.includes(search) && !reason.includes(search) && !employeeName.includes(search)) return false;
    }

    return true;
  });
}

function renderTable() {
  const rows = filterRows(tableData);

  if (!rows.length) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-box-open"></i></div>
            <h3 class="empty-title">Tidak Ada Data</h3>
            <p class="empty-text">Tidak ada barang rusak atau kadaluarsa</p>
          </div>
        </td>
      </tr>
    `;
    showingText.textContent = 'Menampilkan 0 data';
    return;
  }

  historyTableBody.innerHTML = rows.map((r) => {
    let typeBadgeClass = '';
    let statusLabel = '';
    if (r.type === 'expired') {
      typeBadgeClass = 'out-stock';
      statusLabel = 'Kadaluarsa';
    } else if (r.type === 'approaching') {
      typeBadgeClass = 'low-stock';
      statusLabel = 'Mendekati Kadaluarsa';
    } else {
      typeBadgeClass = 'out-stock';
      statusLabel = 'Barang Rusak';
    }

    return `
      <tr>
        <td class="product-cell">
          <div class="product-info">
            <div class="product-image">
              <i class="fas fa-${r.type === 'damaged' ? 'heart-crack' : 'calendar-times'}"></i>
            </div>
            <div class="product-details">
              <div class="product-name">${escapeHtml(r.productName)}</div>
              <div class="product-meta">
                <span class="product-sku">${escapeHtml(r.sku || '-')}</span>
                <span class="product-category">
                  <i class="fas fa-tag"></i>
                  ${getCategoryName(r.category || 'coffee')}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td class="updated-cell">
          <div class="updated-time">
            <div class="updated-date">${escapeHtml(r.type === 'damaged' ? formatDateTime(r.date) : formatDateOnly(r.date))}</div>
          </div>
        </td>
        <td class="status-cell">
          <span class="stock-status ${typeBadgeClass}">
            <i class="fas fa-circle"></i>
            ${escapeHtml(statusLabel)}
          </span>
        </td>
        <td>
          ${escapeHtml(r.reason || '-')}
        </td>
        <td class="quantity-cell">
          <div class="quantity-display">
            <div class="quantity-value">
              ${escapeHtml(r.quantity)}
              <span class="quantity-unit">unit</span>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  showingText.textContent = `Menampilkan ${rows.length} data`;
}

function showError(message) {
  historyTableBody.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
          <h3 class="empty-title">Gagal Memuat Data</h3>
          <p class="empty-text">${escapeHtml(message)}</p>
        </div>
      </td>
    </tr>
  `;
  showingText.textContent = 'Menampilkan 0 data';
}

async function loadData() {
  try {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
            <h3 class="empty-title">Memuat Data...</h3>
            <p class="empty-text">Mohon tunggu sebentar</p>
          </div>
        </td>
      </tr>
    `;
    showingText.textContent = 'Memuat...';

    const [stocks, history] = await Promise.all([
      window.API.Stocks.getAll(),
      window.API.Stocks.getHistoryAll({ limit: 500 })
    ]);

    tableData = [];
    const now = new Date();

    // Process stocks for expiry
    stocks.forEach(s => {
      if (!s.expiry_date) return;
      const expiry = new Date(s.expiry_date);
      const daysToExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
      
      if (daysToExpiry <= 0) {
        tableData.push({
          type: 'expired',
          date: s.expiry_date,
          productName: s.name,
          category: s.category,
          sku: 'SKU-' + s.id,
          reason: `Sudah lewat ${Math.abs(Math.floor(daysToExpiry))} hari`,
          quantity: s.quantity,
          employee: '-'
        });
      } else if (daysToExpiry <= 7) {
        tableData.push({
          type: 'approaching',
          date: s.expiry_date,
          productName: s.name,
          category: s.category,
          sku: 'SKU-' + s.id,
          reason: `Sisa ${Math.ceil(daysToExpiry)} hari lagi`,
          quantity: s.quantity,
          employee: '-'
        });
      }
    });

    // Process history for damaged
    const keywords = ['rusak', 'kadaluarsa', 'expired', 'basi', 'hancur'];
    history.forEach(h => {
      const reason = String(h.change_reason || '').toLowerCase();
      if (keywords.some(kw => reason.includes(kw))) {
        const delta = Math.abs(h.quantity_after - h.quantity_before);
        tableData.push({
          type: 'damaged',
          date: h.changed_at,
          productName: h.material_name || h.name,
          category: h.material_category || h.category,
          sku: h.raw_material_id ? 'SKU-' + h.raw_material_id : '-',
          reason: h.change_reason,
          quantity: delta,
          employee: h.employee_name || '-'
        });
      }
    });

    // Sort by date desc
    tableData.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderTable();
  } catch (err) {
    showError(err.message || 'Unknown error');
  }
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

function setupEventListeners() {
  document.getElementById('backToStockBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('refreshHistoryBtn').addEventListener('click', () => {
    loadData();
  });

  searchInput.addEventListener('input', debounce(() => {
    currentFilters.search = searchInput.value;
    renderTable();
  }, 250));

  typeFilter.addEventListener('change', () => {
    currentFilters.type = typeFilter.value;
    renderTable();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadData();
});
