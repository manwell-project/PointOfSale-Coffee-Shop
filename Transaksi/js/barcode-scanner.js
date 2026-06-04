/**
 * Barcode Scanner for POS System
 * Handles barcode input scanning and adds products to cart
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBarcodScanner);
  } else {
    initBarcodScanner();
  }

  function initBarcodScanner() {
    const barcodeInput = document.getElementById('barcodeInput');
    const barcodeStatus = document.getElementById('barcodeStatus');
    const clearBarcodeBtn = document.getElementById('clearBarcodeBtn');

    if (!barcodeInput) {
      console.warn('Barcode input element not found');
      return;
    }

    // Handle barcode input
    barcodeInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const barcode = barcodeInput.value.trim();
        
        if (!barcode) {
          showBarcodeStatus('Masukkan barcode terlebih dahulu', 'error');
          return;
        }

        await scanBarcode(barcode);
        clearBarcodeInput();
      }
    });

    // Clear button
    if (clearBarcodeBtn) {
      clearBarcodeBtn.addEventListener('click', () => {
        clearBarcodeInput();
      });
    }

    // Auto-focus barcode input
    barcodeInput.focus();
  }

  async function scanBarcode(barcode) {
    const barcodeStatus = document.getElementById('barcodeStatus');
    
    try {
      showBarcodeStatus('Mencari produk...', 'info');

      // Call API to find product by barcode
      const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          showBarcodeStatus(`❌ Barcode tidak ditemukan: ${barcode}`, 'error');
          return;
        }
        throw new Error(`API Error: ${response.statusText}`);
      }

      const product = await response.json();

      // Check stock
      if (!product.quantity || product.quantity <= 0) {
        showBarcodeStatus(`❌ ${product.name} - Stok habis!`, 'error');
        return;
      }

      // Add to cart
      const success = addProductToCart(product);
      
      if (success) {
        showBarcodeStatus(`✅ ${product.name} ditambahkan ke keranjang`, 'success');
        
        // Auto clear status after 2 seconds
        setTimeout(() => {
          barcodeStatus.textContent = '';
          barcodeStatus.className = 'barcode-status';
        }, 2000);
      }

    } catch (err) {
      console.error('Barcode scan error:', err);
      showBarcodeStatus(`❌ Error: ${err.message}`, 'error');
    }
  }

  function addProductToCart(product) {
    try {
      // Check if addToCart function exists (from POS app.js)
      if (typeof window.addToCart !== 'function') {
        console.error('addToCart function not found');
        showBarcodeStatus('❌ Fungsi keranjang tidak tersedia', 'error');
        return false;
      }

      // Add product to cart with qty = 1
      window.addToCart(product.id, product.name, product.price);
      return true;

    } catch (err) {
      console.error('Error adding to cart:', err);
      showBarcodeStatus(`❌ Gagal menambah ke keranjang: ${err.message}`, 'error');
      return false;
    }
  }

  function showBarcodeStatus(message, type) {
    const barcodeStatus = document.getElementById('barcodeStatus');
    if (barcodeStatus) {
      barcodeStatus.textContent = message;
      barcodeStatus.className = `barcode-status ${type}`;
    }
  }

  function clearBarcodeInput() {
    const barcodeInput = document.getElementById('barcodeInput');
    const clearBarcodeBtn = document.getElementById('clearBarcodeBtn');
    const barcodeStatus = document.getElementById('barcodeStatus');

    if (barcodeInput) {
      barcodeInput.value = '';
      barcodeInput.focus();
    }

    if (clearBarcodeBtn) {
      clearBarcodeBtn.style.display = 'none';
    }

    if (barcodeStatus) {
      barcodeStatus.textContent = '';
      barcodeStatus.className = 'barcode-status';
    }
  }

  // Expose functions globally if needed
  window.scanBarcode = scanBarcode;
  window.clearBarcodeInput = clearBarcodeInput;

})();
