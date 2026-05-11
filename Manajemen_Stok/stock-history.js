/**
 * Stock History Page
 * Riwayat stok masuk/keluar (raw materials)
 */

let historyRows = [];
let currentFilters = { search: '', type: '' };

const historyTableBody = document.getElementById('historyTableBody');
const searchInput = document.getElementById('searchHistoryInput');
const typeFilter = document.getElementById('typeFilter');
const showingText = document.getElementById('historyShowingText');

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text ?? '').replace(/[&<>"']/g, (m) => map[m]);
}

function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTypeFromDelta(delta) {
  const d = Number(delta);
  if (!Number.isFinite(d) || d === 0) return 'adjust';
  return d > 0 ? 'in' : 'out';
}

function getTypeLabel(type) {
  switch (type) {
    case 'in':
      return 'Masuk';
    case 'out':
      return 'Keluar';
    default:
      return 'Penyesuaian';
  }
}

function formatDelta(delta) {
  const d = Number(delta);
  if (!Number.isFinite(d)) return '-';
  if (d > 0) return `+${d}`;
  return String(d);
}

function filterRows(rows) {
  const search = (currentFilters.search || '').trim().toLowerCase();
  const type = currentFilters.type || '';

  return rows.filter((r) => {
    if (type) {
      const rowType = getTypeFromDelta(r.delta);
      if (rowType !== type) return false;
    }

    if (search) {
      const materialName = String(r.material_name || r.name || '').toLowerCase();
      const reason = String(r.change_reason || '').toLowerCase();
      const employeeName = String(r.employee_name || '').toLowerCase();
      if (!materialName.includes(search) && !reason.includes(search) && !employeeName.includes(search)) return false;
    }

    return true;
  });
}

function renderTable() {
  const rows = filterRows(historyRows);

  if (!rows.length) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-box-open"></i></div>
            <h3 class="empty-title">Tidak Ada Data</h3>
            <p class="empty-text">Belum ada riwayat stok atau tidak ada hasil yang sesuai filter</p>
          </div>
        </td>
      </tr>
    `;
    showingText.textContent = 'Menampilkan 0 data';
    return;
  }

  historyTableBody.innerHTML = rows.map((r) => {
    const delta = Number(r.delta ?? (Number(r.quantity_after) - Number(r.quantity_before)));
    const type = getTypeFromDelta(delta);
    const typeLabel = getTypeLabel(type);

    const typeBadgeClass = type === 'in' ? 'in-stock' : type === 'out' ? 'out-stock' : 'low-stock';
    const materialName = r.material_name || r.name || '-';

    return `
      <tr>
        <td class="updated-cell">
          <div class="updated-time">
            <div class="updated-date">${escapeHtml(formatDateTime(r.changed_at))}</div>
          </div>
        </td>
        <td class="product-cell">
          <div class="product-info">
            <div class="product-image">
              <i class="fas fa-box"></i>
            </div>
            <div class="product-details">
              <div class="product-name">${escapeHtml(materialName)}</div>
              <div class="product-meta">
                <span class="product-category">
                  <i class="fas fa-tag"></i>
                  ${escapeHtml(r.material_category || r.category || '-')}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td class="status-cell">
          <span class="stock-status ${typeBadgeClass}">
            <i class="fas fa-circle"></i>
            ${escapeHtml(typeLabel)}
          </span>
        </td>
        <td class="quantity-cell">
          <div class="quantity-display">
            <div class="quantity-value">
              ${escapeHtml(r.quantity_before)} → ${escapeHtml(r.quantity_after)}
              <span class="quantity-unit">(${escapeHtml(formatDelta(delta))})</span>
            </div>
          </div>
        </td>
        <td class="quantity-cell">
          <div class="quantity-display">
            <div class="quantity-value">
              ${escapeHtml(r.quantity_after)}
              <span class="quantity-unit">unit</span>
            </div>
          </div>
        </td>
        <td>
          ${escapeHtml(r.change_reason || '-')}
        </td>
        <td>
          ${escapeHtml(r.employee_name || '-')}
        </td>
      </tr>
    `;
  }).join('');

  showingText.textContent = `Menampilkan ${rows.length} data`;
}

function showError(message) {
  historyTableBody.innerHTML = `
    <tr>
      <td colspan="7">
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

async function loadHistory() {
  try {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
            <h3 class="empty-title">Memuat Data...</h3>
            <p class="empty-text">Mohon tunggu sebentar</p>
          </div>
        </td>
      </tr>
    `;
    showingText.textContent = 'Memuat...';

    historyRows = await window.API.Stocks.getHistoryAll({ limit: 200 });
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
    loadHistory();
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
  loadHistory();
});
