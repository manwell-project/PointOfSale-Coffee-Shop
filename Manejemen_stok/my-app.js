// Array untuk menyimpan data stok - SIMPLE VERSION
let stocks = [];

function updateStats() {
    const totalProductsEl = document.getElementById('totalProducts');
    const totalStockQtyEl = document.getElementById('totalStockQty');
    const lowStockCountEl = document.getElementById('lowStockCount');

    if (!totalProductsEl || !totalStockQtyEl || !lowStockCountEl) return;

    const totalProducts = stocks.length;
    const totalQty = stocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const lowCount = stocks.reduce((sum, s) => sum + (((Number(s.quantity) || 0) <= (Number(s.minStock) || 0)) ? 1 : 0), 0);

    totalProductsEl.textContent = totalProducts;
    totalStockQtyEl.textContent = totalQty;
    lowStockCountEl.textContent = lowCount;
}

// Fungsi untuk menampilkan form tambah stok
function showAddForm() {
    document.getElementById('addForm').style.display = 'block';
}

// Fungsi untuk menyembunyikan form tambah stok
function cancelAdd() {
    document.getElementById('addForm').style.display = 'none';
    clearForm();
}

// Fungsi untuk membersihkan form
function clearForm() {
    document.getElementById('productName').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('minStock').value = '';
}

// Fungsi untuk menyimpan stok baru
function saveStock() {
    // Ambil nilai dari form
    const productName = document.getElementById('productName').value;
    const quantity = document.getElementById('quantity').value;
    const minStock = document.getElementById('minStock').value;
    
    // Validasi sederhana
    if (productName === '' || quantity === '' || minStock === '') {
        showMessage('Semua field harus diisi!', 'error');
        return;
    }
    
    // Buat object stok baru
    const newStock = {
        id: Date.now(), // ID sederhana menggunakan timestamp
        name: productName,
        quantity: parseInt(quantity),
        minStock: parseInt(minStock)
    };
    
    // Tambah ke array stocks
    stocks.push(newStock);
    
    // Tampilkan pesan sukses
    showMessage('Stok berhasil ditambahkan!', 'success');
    
    // Sembunyikan form dan bersihkan
    cancelAdd();
    
    // Tampilkan ulang daftar stok
    displayStocks();
}

// Fungsi untuk menampilkan daftar stok
function displayStocks(list = stocks) {
    const stockList = document.getElementById('stockList');
    
    if (!stockList) return;

    if (!list || list.length === 0) {
        stockList.innerHTML = '<div class="empty-state">Belum ada stok yang ditambahkan.</div>';
        updateStats();
        return;
    }
    
    let html = '';
    list.forEach(function(stock) {
        html += `
            <div class="stock-item">
                <h4>${stock.name}</h4>
                <p>Jumlah: ${stock.quantity}</p>
                <p>Minimum: ${stock.minStock}</p>
            </div>
        `;
    });
    
    stockList.innerHTML = html;
    updateStats();
}

// Fungsi untuk menampilkan pesan
function showMessage(message, type) {
    // Hapus pesan lama jika ada
    const oldAlert = document.querySelector('.alert');
    if (oldAlert) {
        oldAlert.remove();
    }
    
    // Buat elemen pesan baru
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    // Tambahkan ke halaman
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alert, mainContent.firstChild);
    
    // Hapus pesan setelah 3 detik
    setTimeout(function() {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    displayStocks();

    const searchInput = document.getElementById('searchStockInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const term = (searchInput.value || '').trim().toLowerCase();
            if (!term) {
                displayStocks(stocks);
                return;
            }
            const filtered = stocks.filter(s => (s.name || '').toLowerCase().includes(term));
            displayStocks(filtered);
        });
    }
});