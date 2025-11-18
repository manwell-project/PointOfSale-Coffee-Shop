// Array untuk menyimpan data stok - SIMPLE VERSION
let stocks = [];

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
function displayStocks() {
    const stockList = document.getElementById('stockList');
    
    if (stocks.length === 0) {
        stockList.innerHTML = '<p>Belum ada stok yang ditambahkan.</p>';
        return;
    }
    
    let html = '';
    stocks.forEach(function(stock) {
        html += `
            <div class="stock-item">
                <h4>${stock.name}</h4>
                <p>Jumlah: ${stock.quantity}</p>
                <p>Minimum: ${stock.minStock}</p>
            </div>
        `;
    });
    
    stockList.innerHTML = html;
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
});