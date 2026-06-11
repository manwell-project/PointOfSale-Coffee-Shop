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
    // Di aplikasi nyata, kita memfilter transaksi hari ini dan yang statusnya belum selesai semua.
    // Tapi karena tabel db tidak punya kds_status (hanya status='completed'), kita simulasi.
    // Asumsi: Semua transaksi dari server kita anggap "pesanan".
    // Idealnya, di DB ada `kds_status` ('pending', 'preparing', 'completed').
    // Untuk demo ini, jika tidak ada `kds_status` di API, kita set default 'pending' ke localStorage.
    
    // Kita ambil dari API
    const date = new Date().toISOString().split('T')[0];
    const data = await API.Transactions.getAll(); // Ambil semua transaksi melalui API helper
    
    // Ambil data status dari localStorage (karena kita ga rubah schema db)
    const localKdsStatus = JSON.parse(localStorage.getItem('kds_status_map')) || {};

    const formattedOrders = [];
    
    for (let txt of data) {
      // Ambil detail items
      const detail = await API.Transactions.getById(txt.id);
      
      let currentStatus = localKdsStatus[txt.id] || 'pending';

      formattedOrders.push({
        id: txt.id,
        transaction_no: txt.id, // atau txt.transaction_no jika ada
        time: txt.created_at,
        status: currentStatus,
        customer: txt.customer_name || 'Walk-in',
        items: detail.items || []
      });
    }

    orders = formattedOrders;
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
      actionHtml = `<button class="button button-fill btn-status color-blue" onclick="updateStatus(${order.id}, 'preparing')">Mulai Buat</button>`;
      countPending++;
    } else if (order.status === 'preparing') {
      actionHtml = `<button class="button button-fill btn-status color-green" onclick="updateStatus(${order.id}, 'completed')">Selesai</button>`;
      countPreparing++;
    } else {
      actionHtml = `<button class="button button-fill btn-status color-gray" onclick="updateStatus(${order.id}, 'pending')">Re-open</button>`;
      countCompleted++;
    }

    card.innerHTML = `
      <div class="order-header">
        <div class="order-id">#${order.transaction_no} - ${order.customer}</div>
        <div class="order-time">${formatTime(order.time)}</div>
      </div>
      <ul class="order-items">
        ${itemsHtml}
      </ul>
      <div class="order-actions">
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
window.updateStatus = function(orderId, newStatus) {
  // Update state lokal
  const order = orders.find(o => o.id === orderId);
  if(order) {
    order.status = newStatus;
  }
  
  // Simpan mapping status ke localStorage sebagai simulasi DB
  const localKdsStatus = JSON.parse(localStorage.getItem('kds_status_map')) || {};
  localKdsStatus[orderId] = newStatus;
  localStorage.setItem('kds_status_map', JSON.stringify(localKdsStatus));

  renderOrders();
}

// Auto-refresh tiap 10 detik
setInterval(() => {
  fetchOrders();
}, 10000);

// Init
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  fetchOrders();
});