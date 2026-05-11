/**
 * Stock Notifications Page
 * DigiCaf Coffee Shop POS System
 */

let stocks = [];

// Alerts state
let currentAlerts = [];
let currentAlertFilter = 'all';
let readAlertKeys = new Set();

const ALERTS_READ_STORAGE_KEY = 'digicaf.stockAlerts.readKeys';

// DOM
const alertsPageList = document.getElementById('alertsPageList');
const refreshAlertsBtn = document.getElementById('refreshAlertsBtn');
const backToStockBtn = document.getElementById('backToStockBtn');
const markAllReadPageBtn = document.getElementById('markAllReadPage');

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

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTimeAgo(date) {
  if (!date) return '-';
  const now = new Date();
  const past = new Date(date);
  if (Number.isNaN(past.getTime())) return '-';

  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' hari lalu';
  return formatDate(date);
}

function showNotification(message, type = 'info') {
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

function getMinStock(stock) {
  if (stock?.min_stock !== undefined && stock?.min_stock !== null) return Number(stock.min_stock) || 0;
  return Number(stock?.minStock) || 0;
}

function getQty(stock) {
  return Number(stock?.quantity) || 0;
}

function getAlertKey(alert) {
  return `${alert.type}:${alert.id}`;
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
    // ignore
  }
}

function updateAlertBadge() {
  const badge = document.getElementById('alertsBadgePage');
  if (!badge) return;

  const unreadCount = (currentAlerts || []).filter((a) => !readAlertKeys.has(getAlertKey(a))).length;
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? '' : 'none';
}

function computeAlertsFromStocks() {
  const criticalStocks = stocks.filter((s) => getQty(s) === 0);
  const warningStocks = stocks.filter((s) => {
    const qty = getQty(s);
    const minQty = getMinStock(s);
    return qty > 0 && qty <= minQty;
  });

  currentAlerts = [
    ...criticalStocks.map((s) => ({ ...s, type: 'critical', message: 'Stok habis, segera lakukan restock' })),
    ...warningStocks.map((s) => ({ ...s, type: 'warning', message: 'Stok mendekati batas minimum' }))
  ];
}

function filterAlerts(alerts) {
  if (!currentAlertFilter || currentAlertFilter === 'all') return alerts;
  return (alerts || []).filter((a) => a.type === currentAlertFilter);
}

function renderAlertsListPage() {
  if (!alertsPageList) return;

  const filtered = filterAlerts(currentAlerts);

  if (!filtered.length) {
    const emptyText = currentAlerts.length ? 'Coba pilih filter lain' : 'Tidak ada notifikasi stok saat ini';
    alertsPageList.innerHTML = `
      <div class="alerts-empty">
        <div class="empty-alert-icon"><i class="fas fa-bell-slash"></i></div>
        <div class="empty-alert-title">Tidak ada notifikasi</div>
        <div class="empty-alert-text">${escapeHtml(emptyText)}</div>
      </div>
    `;
    updateAlertBadge();
    return;
  }

  alertsPageList.innerHTML = filtered.map((alert) => {
    const key = getAlertKey(alert);
    const isUnread = !readAlertKeys.has(key);
    const icon = alert.type === 'critical' ? 'times-circle' : 'exclamation-triangle';
    const qty = getQty(alert);
    const minQty = getMinStock(alert);

    return `
      <div class="alert-item ${escapeHtml(alert.type)}${isUnread ? ' unread' : ''}" data-alert-key="${escapeHtml(key)}">
        <div class="alert-item-icon">
          <i class="fas fa-${icon}"></i>
          <span class="priority-dot"></span>
        </div>
        <div class="alert-item-content">
          <div class="alert-item-header">
            <div class="alert-item-title">${escapeHtml(alert.name || '-') }</div>
            <div class="alert-item-time">${escapeHtml(getTimeAgo(alert.updated_at || alert.created_at))}</div>
          </div>
          <div class="alert-item-message">${escapeHtml(alert.message || '')}</div>
          <div class="alert-item-details">
            <div class="alert-detail">
              <i class="fas fa-box"></i>
              Stok: <strong>${escapeHtml(qty)} unit</strong>
            </div>
            <div class="alert-detail">
              <i class="fas fa-chart-line"></i>
              Min: <strong>${escapeHtml(minQty)} unit</strong>
            </div>
          </div>
          <div class="alert-item-actions">
            <a class="btn-alert-action primary" href="index.html">
              <i class="fas fa-boxes"></i>
              Buka Stok
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateAlertBadge();
}

function markAlertReadByKey(key) {
  if (!key) return;
  if (readAlertKeys.has(key)) return;
  readAlertKeys.add(key);
  saveReadAlertKeys();
  renderAlertsListPage();
}

function markAllAlertsRead() {
  (currentAlerts || []).forEach((a) => readAlertKeys.add(getAlertKey(a)));
  saveReadAlertKeys();
  renderAlertsListPage();
  showNotification('Semua notifikasi ditandai sudah dibaca', 'success');
}

async function loadStocks() {
  try {
    stocks = await window.API.Stocks.getAll();
    computeAlertsFromStocks();
    renderAlertsListPage();
  } catch (err) {
    alertsPageList.innerHTML = `
      <div class="alerts-empty">
        <div class="empty-alert-icon"><i class="fas fa-exclamation-circle"></i></div>
        <div class="empty-alert-title">Gagal Memuat Data</div>
        <div class="empty-alert-text">${escapeHtml(err?.message || 'Unknown error')}</div>
      </div>
    `;
    updateAlertBadge();
  }
}

function setupEventListeners() {
  if (refreshAlertsBtn) {
    refreshAlertsBtn.addEventListener('click', () => loadStocks());
  }

  if (backToStockBtn) {
    backToStockBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  document.querySelectorAll('.btn-alert-filter').forEach((btn) => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.btn-alert-filter').forEach((b) => b.classList.remove('active'));
      this.classList.add('active');
      currentAlertFilter = this.dataset.filter || 'all';
      renderAlertsListPage();
    });
  });

  if (markAllReadPageBtn) {
    markAllReadPageBtn.addEventListener('click', () => markAllAlertsRead());
  }

  if (alertsPageList) {
    alertsPageList.addEventListener('click', (e) => {
      // Don't mark as read when clicking action button/link
      if (e.target.closest('.btn-alert-action')) return;

      const alertItem = e.target.closest('.alert-item');
      if (!alertItem) return;
      const key = alertItem.dataset.alertKey;
      if (!key) return;
      markAlertReadByKey(key);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  readAlertKeys = loadReadAlertKeys();
  setupEventListeners();
  loadStocks();

  // Refresh every 30 seconds (match stock page behavior)
  setInterval(loadStocks, 30000);
});
