const app = new Framework7({
  el: '#app',
  name: 'Digicaff',
  theme: 'auto',
  // ...tambahkan konfigurasi lain jika perlu...
});

document.addEventListener('DOMContentLoaded', async function () {
  const keranjang = [];
  const keranjangList = document.getElementById('keranjang-list');
  const totalHarga = document.getElementById('total-harga');
  const uangCustomer = document.getElementById('uang-customer');
  const kembalianSpan = document.getElementById('kembalian');
  const produkListEl = document.querySelector('.produk-list');

  // Load products dari API
  async function loadProducts() {
    try {
      console.log('📦 Loading products dari API...');
      const products = await API.Products.getAll();
      
      if (!produkListEl) return;
      
      produkListEl.innerHTML = '';
      products.forEach(product => {
        const produkItem = document.createElement('div');
        produkItem.className = 'produk-item';
        produkItem.innerHTML = `
          <span class="produk-nama">${product.name}</span>
          <span class="produk-harga">Rp ${product.price.toLocaleString()}</span>
          <input type="number" min="1" value="1" class="produk-jumlah" />
          <button class="btn-tambah" data-id="${product.id}" data-nama="${product.name}" data-harga="${product.price}">Tambah</button>
        `;
        produkListEl.appendChild(produkItem);
      });
      
      // Re-attach event listeners ke products yang baru di-load
      attachProductListeners();
      console.log(`✅ ${products.length} products loaded`);
    } catch (err) {
      console.error('❌ Error loading products:', err.message);
      if (produkListEl) {
        produkListEl.innerHTML = `<div style="padding:12px;color:#f44336">⚠️ Error: ${err.message}</div>`;
      }
    }
  }

  function hitungTotal() {
    return keranjang.reduce((total, item) => total + item.harga * item.jumlah, 0);
  }

  function renderKeranjang() {
    keranjangList.innerHTML = '';
    if (keranjang.length === 0) {
      keranjangList.innerHTML = '<li style="color:#999">Keranjang kosong</li>';
      totalHarga.textContent = 'Rp 0';
      return;
    }
    
    keranjang.forEach((item, idx) => {
      const li = document.createElement('li');
      li.textContent = `${item.nama} x${item.jumlah} = Rp ${(item.harga * item.jumlah).toLocaleString()} `;
      
      const btnKurangi = document.createElement('button');
      btnKurangi.textContent = 'Kurangi';
      btnKurangi.className = 'btn-kurangi';
      btnKurangi.style.marginLeft = '8px';
      btnKurangi.onclick = function () {
        if (item.jumlah > 1) {
          item.jumlah -= 1;
        } else {
          keranjang.splice(idx, 1);
        }
        renderKeranjang();
        updateKembalian();
      };
      li.appendChild(btnKurangi);
      keranjangList.appendChild(li);
    });
    
    const total = hitungTotal();
    totalHarga.textContent = 'Rp ' + total.toLocaleString();
    updateKembalian();
  }

  function updateKembalian() {
    const total = hitungTotal();
    const uang = parseInt(uangCustomer.value, 10) || 0;
    const kembali = uang - total;
    kembalianSpan.textContent = 'Rp ' + (kembali >= 0 ? kembali.toLocaleString() : '0');
  }

  function attachProductListeners() {
    document.querySelectorAll('.btn-tambah').forEach(btn => {
      btn.onclick = function () {
        const id = parseInt(this.dataset.id, 10);
        const nama = this.dataset.nama;
        const harga = parseInt(this.dataset.harga, 10);
        const jumlahInput = this.parentElement.querySelector('.produk-jumlah');
        const jumlah = parseInt(jumlahInput.value, 10) || 1;
        
        // Set jumlah kembali ke 1
        jumlahInput.value = 1;
        
        // Cari item yang sudah ada di keranjang
        const existing = keranjang.find(item => item.id === id);
        if (existing) {
          existing.jumlah += jumlah;
        } else {
          keranjang.push({ id, nama, harga, jumlah });
        }
        
        renderKeranjang();
        showNotification(`${nama} ditambahkan ke keranjang!`, 'success');
      };
    });
  }

  uangCustomer.addEventListener('input', updateKembalian);

  document.getElementById('btn-bayar').addEventListener('click', async function () {
    const total = hitungTotal();
    const uang = parseInt(uangCustomer.value, 10) || 0;
    
    if (keranjang.length === 0) {
      showNotification('Keranjang kosong!', 'error');
      return;
    }
    if (uang < total) {
      showNotification('Uang customer kurang!', 'error');
      return;
    }

    // Disable button
    this.disabled = true;
    this.textContent = 'Processing...';

    try {
      // Save transaction to API
      const trx = await API.Transactions.create({
        items: keranjang.map((it) => ({
          product_id: it.id,
          quantity: it.jumlah,
          unit_price: it.harga,
          subtotal: it.harga * it.jumlah
        })),
        customer_id: null,
        employee_id: null,
        payment_method: 'cash',
        total_amount: total
      });

      const kembali = uang - total;
      showNotification(`✅ Transaksi #${trx.id} berhasil!`, 'success');
      
      // Show receipt
      alert(
        `TRANSAKSI BERHASIL\n` +
        `================\n` +
        `No: ${trx.id}\n` +
        `Total: ${formatRupiah(total)}\n` +
        `Uang: ${formatRupiah(uang)}\n` +
        `Kembali: ${formatRupiah(kembali)}\n` +
        `\nTerima kasih!`
      );
      
      // Reset
      keranjang.length = 0;
      uangCustomer.value = 0;
      renderKeranjang();
    } catch (err) {
      showNotification(`❌ ${err.message}`, 'error');
    } finally {
      this.disabled = false;
      this.textContent = 'Bayar';
    }
  });

  // Load products on page load
  await loadProducts();
  renderKeranjang();
});