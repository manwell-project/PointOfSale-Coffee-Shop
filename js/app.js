// DOM Elements
const addCustomerBtn = document.getElementById('addCustomerBtn');
const addCustomerModal = document.getElementById('addCustomerModal');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.getElementById('cancelBtn');
const customerForm = document.getElementById('customerForm');
const notification = document.getElementById('notification');
const tabs = document.querySelectorAll('.tab');
const customerList = document.getElementById('customerList');
const totalCustomersEl = document.getElementById('totalCustomers');
const newCustomersEl = document.getElementById('newCustomers');

// Data pelanggan
let customers = [];
let totalCustomers = 5;
let newCustomers = 0;
let editingCustomer = null;

// Fungsi untuk membuat initials dari nama
function getInitials(name) {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Fungsi untuk menambahkan pelanggan ke daftar
function addCustomerToList(name, phone, email, type) {
    const initials = getInitials(name);
    const customerCard = document.createElement('div');
    customerCard.className = 'customer-card';
    customerCard.innerHTML = `
        <div class="customer-avatar">${initials}</div>
        <div class="customer-info">
            <div class="customer-name">${name}</div>
            <div class="customer-details">${type === 'vip' ? 'VIP' : 'Baru'} • ${phone}</div>
        </div>
        <div class="customer-actions">
            <div class="action-btn edit-btn"><i class="fas fa-edit"></i></div>
            <div class="action-btn delete-btn"><i class="fas fa-trash"></i></div>
        </div>
    `;
    
    // Tambahkan event listener untuk edit dan hapus
    const editBtn = customerCard.querySelector('.edit-btn');
    const deleteBtn = customerCard.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => editCustomer(customerCard, name, phone, email, type));
    deleteBtn.addEventListener('click', () => deleteCustomer(customerCard));
    
    customerList.appendChild(customerCard);
}

// Fungsi untuk edit pelanggan
function editCustomer(customerCard, name, phone, email, type) {
    editingCustomer = customerCard;
    
    // Isi form dengan data yang ada
    document.getElementById('customerName').value = name;
    document.getElementById('customerPhone').value = phone;
    document.getElementById('customerEmail').value = email;
    document.getElementById('customerType').value = type;
    
    // Ubah judul modal
    document.querySelector('.modal-title').textContent = 'Edit Pelanggan';
    
    // Tampilkan modal
    addCustomerModal.style.display = 'flex';
}

// Fungsi untuk hapus pelanggan
function deleteCustomer(customerCard) {
    if (confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
        customerCard.remove();
        totalCustomers--;
        totalCustomersEl.textContent = totalCustomers;
        showNotification('Pelanggan berhasil dihapus!');
    }
}

// Tambahkan event listener untuk existing customers
function addEventListenersToExistingCustomers() {
    const existingCards = document.querySelectorAll('.customer-card');
    existingCards.forEach(card => {
        const editBtn = card.querySelector('.action-btn:first-child');
        const deleteBtn = card.querySelector('.action-btn:last-child');
        
        if (editBtn && deleteBtn) {
            editBtn.classList.add('edit-btn');
            deleteBtn.classList.add('delete-btn');
            
            const name = card.querySelector('.customer-name').textContent;
            const details = card.querySelector('.customer-details').textContent;
            
            editBtn.addEventListener('click', () => {
                const phone = details.includes('+62') ? details.split(' • ')[1] || details.split(' • ')[0] : '+62';
                editCustomer(card, name, phone, '', 'reguler');
            });
            
            deleteBtn.addEventListener('click', () => deleteCustomer(card));
        }
    });
}

// Event Listeners
addCustomerBtn.addEventListener('click', () => {
    editingCustomer = null;
    document.querySelector('.modal-title').textContent = 'Tambah Pelanggan Baru';
    customerForm.reset();
    addCustomerModal.style.display = 'flex';
});

closeBtn.addEventListener('click', () => {
    addCustomerModal.style.display = 'none';
    editingCustomer = null;
});

cancelBtn.addEventListener('click', () => {
    addCustomerModal.style.display = 'none';
    editingCustomer = null;
});

customerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Ambil data dari form
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const email = document.getElementById('customerEmail').value;
    const type = document.getElementById('customerType').value;
    
    if (editingCustomer) {
        // Update pelanggan yang sudah ada
        const initials = getInitials(name);
        editingCustomer.querySelector('.customer-avatar').textContent = initials;
        editingCustomer.querySelector('.customer-name').textContent = name;
        editingCustomer.querySelector('.customer-details').textContent = `${type === 'vip' ? 'VIP' : 'Baru'} • ${phone}`;
        
        showNotification('Pelanggan berhasil diperbarui!');
        editingCustomer = null;
    } else {
        // Tambahkan pelanggan baru
        addCustomerToList(name, phone, email, type);
        
        // Update statistik
        totalCustomers++;
        newCustomers++;
        totalCustomersEl.textContent = totalCustomers;
        newCustomersEl.textContent = newCustomers;
        
        showNotification('Pelanggan berhasil ditambahkan!');
    }
    
    // Tutup modal
    addCustomerModal.style.display = 'none';
    
    // Reset form
    customerForm.reset();
});

// Tab functionality
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === addCustomerModal) {
        addCustomerModal.style.display = 'none';
    }
});

// Inisialisasi Framework7
const app = new Framework7({
  root: '#app', // Elemen root aplikasi
  name: 'My App', // Nama aplikasi
  theme: 'auto', // Deteksi tema otomatis (iOS/Material)
  routes: [], // Tambahkan rute di sini jika diperlukan
});

// Inisialisasi event listeners untuk pelanggan yang sudah ada
document.addEventListener('DOMContentLoaded', () => {
    addEventListenersToExistingCustomers();
});
