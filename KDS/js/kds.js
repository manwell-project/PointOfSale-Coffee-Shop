const app = new Framework7({
  el: '#app',
  theme: 'auto',
  name: 'DigiCaf KDS',
});

// State untuk menyimpan pesanan
let orders = [];

// Fungsi format waktu
function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Menjalankan jam hidup
function startClock() {
  const clockEl = document.getElementById('clock');
  setInterval(() => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('id-ID');
  }, 1000);
}

// Fetch transaksi dari API
async function fetchOrders() {
  try {
    const data = await API.Transactions.getActiveKdsOrders();
    orders = data;
    renderOrders();
  } catch (err) {
    app.toast.create({ text: 'Error mengambil data pesanan: ' + err.message, position: 'center', closeTimeout: 2000 }).open();
  }
}

// Render kolom
function renderOrders() {
  const pendingList = document.getElementById('list-pending');
  const preparingList = document.getElementById('list-preparing');
  const completedList = document.getElementById('list-completed');

  pendingList.innerHTML = '';
  preparingList.innerHTML = '';
  completedList.innerHTML = '';

  let countPending = 0;
  let countPreparing = 0;
  let countCompleted = 0;

  orders.forEach(order => {
    if(!order.items.length) return; // skip if no items

    const card = document.createElement('div');
    card.className = `order-card status-${order.status}`;
    
    let itemsHtml = order.items.map(item => `
      <li>
        <span class="item-qty">${item.quantity}x</span>
        <span class="item-name">${item.product_name}</span>
      </li>
    `).join('');

    let actionHtml = '';
    if (order.status === 'pending') {
      actionHtml = `<button class="button button-fill" style="background: #3498DB; font-weight: 600; width: 100%; border-radius: 8px;" onclick="updateStatus(${order.id}, 'preparing')"><i class="fas fa-play" style="margin-right: 6px;"></i> Mulai Buat</button>`;
      countPending++;
    } else if (order.status === 'preparing') {
      actionHtml = `<button class="button button-fill" style="background: #27AE60; font-weight: 600; width: 100%; border-radius: 8px;" onclick="updateStatus(${order.id}, 'completed')"><i class="fas fa-check" style="margin-right: 6px;"></i> Selesai</button>`;
      countPreparing++;
    } else {
      actionHtml = `<button class="button button-fill" style="background: #95A5A6; font-weight: 600; width: 100%; border-radius: 8px;" onclick="updateStatus(${order.id}, 'pending')"><i class="fas fa-undo" style="margin-right: 6px;"></i> Ulangi</button>`;
      countCompleted++;
    }

    card.innerHTML = `
      <div class="order-header">
        <div class="order-id">#${order.transaction_no} - <span style="color: var(--color-primary, #8B5A2B);"><i class="fas fa-user"></i> ${order.customer}</span></div>
        <div class="order-time"><i class="fas fa-clock"></i> ${formatTime(order.time)}</div>
      </div>
      <ul class="order-items" style="padding-left: 0;">
        ${itemsHtml}
      </ul>
      <div class="order-actions" style="margin-top: 16px;">
        ${actionHtml}
      </div>
    `;

    if (order.status === 'pending') pendingList.appendChild(card);
    else if (order.status === 'preparing') preparingList.appendChild(card);
    else if (order.status === 'completed') completedList.appendChild(card);
  });

  document.getElementById('count-pending').textContent = countPending;
  document.getElementById('count-preparing').textContent = countPreparing;
  document.getElementById('count-completed').textContent = countCompleted;
}

// Update status pesanan
window.updateStatus = async function(orderId, newStatus) {
  // Optimistic UI update
  const order = orders.find(o => o.id === orderId);
  if(order) {
    order.status = newStatus;
    renderOrders();
  }
  
  // Update to Backend
  try {
    await API.Transactions.updateKdsStatus(orderId, newStatus);
    // Refresh to ensure sync
    fetchOrders();
  } catch (err) {
    app.toast.create({ text: 'Gagal update status: ' + err.message, position: 'center', closeTimeout: 2000 }).open();
  }
}

// Auto-refresh tiap 15 detik (menghemat beban server)
setInterval(() => {
  fetchOrders();
}, 15000);

// Init
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  fetchOrders();
});