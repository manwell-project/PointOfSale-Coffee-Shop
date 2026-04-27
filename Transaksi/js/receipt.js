/**
 * ================================================
 * RECEIPT PRINTING MODULE
 * ================================================
 * Handles receipt generation, display, and printing
 */

class ReceiptManager {
  constructor(options = {}) {
    this.config = {
      shopName: options.shopName || 'DigiCaf Coffee Shop',
      shopSubtitle: options.shopSubtitle || 'Kopi Berkualitas Tinggi',
      shopAddress: options.shopAddress || 'Jl. Coffee Street No. 123',
      shopPhone: options.shopPhone || '0812-3456-7890',
      ...options
    };
    
    this.currentReceipt = null;
  }

  /**
   * Generate receipt HTML
   */
  generateReceiptHTML(transactionData) {
    const {
      transactionId,
      items,
      subtotal = 0,
      tax = 0,
      discount = 0,
      total,
      paymentMethod,
      paymentAmount,
      changeAmount = 0,
      customerName = null,
      customerPhone = null,
      timestamp = new Date(),
      cashier = 'Admin'
    } = transactionData;

    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('id-ID');
    const timeStr = date.toLocaleTimeString('id-ID');

    const itemsHTML = items
      .map(
        item => `
        <div class="receipt-item">
          <div class="receipt-item-details">
            <span class="receipt-item-name">${item.name}</span>
            <span class="receipt-item-qty">${item.quantity} x Rp ${this.formatCurrency(item.price)}</span>
          </div>
          <span class="receipt-item-price">Rp ${this.formatCurrency(item.subtotal)}</span>
        </div>
      `
      )
      .join('');

    const taxHTML =
      tax > 0
        ? `
        <div class="receipt-summary-row">
          <span class="receipt-summary-label">PPN (10%)</span>
          <span class="receipt-summary-value">Rp ${this.formatCurrency(tax)}</span>
        </div>
      `
        : '';

    const discountHTML =
      discount > 0
        ? `
        <div class="receipt-summary-row">
          <span class="receipt-summary-label">Diskon</span>
          <span class="receipt-summary-value">-Rp ${this.formatCurrency(discount)}</span>
        </div>
      `
        : '';

    const customerHTML =
      customerName
        ? `
        <div class="receipt-info-item">
          <span class="receipt-info-label">PELANGGAN</span>
          <span class="receipt-info-value">${customerName}</span>
        </div>
      `
        : '';

    const paymentMethodLabel = {
      cash: 'Tunai',
      card: 'Kartu Kredit',
      ewallet: 'E-Wallet',
      transfer: 'Transfer Bank'
    }[paymentMethod] || 'Tunai';

    return `
      <div class="receipt-container print-view">
        <!-- HEADER -->
        <div class="receipt-header">
          <div class="receipt-shop-name">☕ ${this.config.shopName}</div>
          <div class="receipt-shop-subtitle">${this.config.shopSubtitle}</div>
          <div class="receipt-shop-info">
            ${this.config.shopAddress}<br>
            Tel: ${this.config.shopPhone}
          </div>
        </div>

        <!-- TRANSACTION INFO -->
        <div class="receipt-transaction-info">
          <div class="receipt-info-item">
            <span class="receipt-info-label">NO. STRUK</span>
            <span class="receipt-info-value">#${transactionId}</span>
          </div>
          <div class="receipt-info-item">
            <span class="receipt-info-label">KASIR</span>
            <span class="receipt-info-value">${cashier}</span>
          </div>
          <div class="receipt-info-item">
            <span class="receipt-info-label">TANGGAL</span>
            <span class="receipt-info-value">${dateStr}</span>
          </div>
          <div class="receipt-info-item">
            <span class="receipt-info-label">JAM</span>
            <span class="receipt-info-value">${timeStr}</span>
          </div>
          ${customerHTML}
        </div>

        <!-- ITEMS -->
        <div class="receipt-items">
          ${itemsHTML}
        </div>

        <!-- SUMMARY -->
        <div class="receipt-summary">
          <div class="receipt-summary-row">
            <span class="receipt-summary-label">Subtotal</span>
            <span class="receipt-summary-value">Rp ${this.formatCurrency(subtotal)}</span>
          </div>
          ${taxHTML}
          ${discountHTML}
        </div>

        <!-- TOTAL -->
        <div class="receipt-total-row">
          <span class="receipt-total-label">TOTAL</span>
          <span class="receipt-total-value">Rp ${this.formatCurrency(total)}</span>
        </div>

        <!-- PAYMENT INFO -->
        <div class="receipt-payment-info">
          <div class="receipt-payment-row">
            <span class="receipt-payment-label">Metode Bayar</span>
            <span class="receipt-payment-value">${paymentMethodLabel}</span>
          </div>
          <div class="receipt-payment-row">
            <span class="receipt-payment-label">Jumlah Bayar</span>
            <span class="receipt-payment-value">Rp ${this.formatCurrency(paymentAmount)}</span>
          </div>
          <div class="receipt-payment-row" style="border-top: 1px dashed #ddd; padding-top: 6px; margin-top: 6px;">
            <span class="receipt-payment-label" style="font-weight: bold;">Kembalian</span>
            <span class="receipt-payment-value" style="color: #4caf50;">Rp ${this.formatCurrency(changeAmount)}</span>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="receipt-footer">
          <div class="receipt-message">Terima kasih telah berbelanja 🙏</div>
          <div style="margin-top: 8px;">
            Kepuasan Anda adalah prioritas kami
          </div>
          <div style="margin-top: 8px; font-size: 9px;">
            Generated: ${new Date().toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Display receipt in modal
   */
  showReceipt(transactionData) {
    this.currentReceipt = transactionData;
    
    // Generate receipt HTML
    const receiptHTML = this.generateReceiptHTML(transactionData);

    // Get or create modal
    let modal = document.getElementById('receiptModal');
    if (!modal) {
      modal = this.createReceiptModal();
      document.body.appendChild(modal);
    }

    // Set receipt content
    const bodyContainer = modal.querySelector('.receipt-modal-body');
    bodyContainer.innerHTML = receiptHTML;

    // Show modal
    modal.classList.add('active');

    // Scroll to top
    bodyContainer.scrollTop = 0;

    console.log('✅ Receipt displayed:', transactionData);
  }

  /**
   * Create receipt modal element
   */
  createReceiptModal() {
    const modal = document.createElement('div');
    modal.id = 'receiptModal';
    modal.className = 'receipt-modal';
    modal.innerHTML = `
      <div class="receipt-modal-content">
        <div class="receipt-modal-header">
          <h2>
            <i class="fas fa-receipt"></i> Struk Pembayaran
          </h2>
          <button class="receipt-modal-close print-hide" onclick="receiptManager.closeReceipt()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="receipt-modal-body">
          <!-- Receipt content will be inserted here -->
        </div>

        <div class="receipt-modal-footer print-hide">
          <button class="btn-print-receipt" onclick="receiptManager.printReceipt()">
            <i class="fas fa-print"></i> Cetak
          </button>
          <button class="btn-close-receipt" onclick="receiptManager.closeReceipt()">
            <i class="fas fa-times"></i> Tutup
          </button>
        </div>
      </div>
    `;

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeReceipt();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (modal.classList.contains('active')) {
        if (e.key === 'Escape') {
          this.closeReceipt();
        } else if (e.key === 'p' && e.ctrlKey) {
          e.preventDefault();
          this.printReceipt();
        }
      }
    });

    return modal;
  }

  /**
   * Print receipt
   */
  printReceipt() {
    if (!this.currentReceipt) {
      console.warn('No receipt to print');
      return;
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    const receiptHTML = this.generateReceiptHTML(this.currentReceipt);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Struk #${this.currentReceipt.transactionId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Courier New', monospace;
            background: white;
            padding: 0;
          }

          .receipt-container {
            width: 80mm;
            margin: 0 auto;
            padding: 10mm;
            font-size: 10px;
            line-height: 1.6;
            color: #333;
          }

          .receipt-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #999;
          }

          .receipt-shop-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
          }

          .receipt-shop-subtitle {
            font-size: 10px;
            color: #666;
            margin-bottom: 8px;
          }

          .receipt-shop-info {
            font-size: 9px;
            color: #999;
            line-height: 1.3;
          }

          .receipt-transaction-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 10px;
          }

          .receipt-info-item {
            display: flex;
            flex-direction: column;
          }

          .receipt-info-label {
            color: #999;
            font-size: 9px;
            margin-bottom: 2px;
          }

          .receipt-info-value {
            color: #333;
            font-weight: 600;
          }

          .receipt-items {
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #999;
          }

          .receipt-item {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
            margin-bottom: 6px;
            align-items: flex-start;
          }

          .receipt-item-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .receipt-item-name {
            font-weight: 600;
            color: #333;
          }

          .receipt-item-qty {
            font-size: 9px;
            color: #666;
          }

          .receipt-item-price {
            text-align: right;
            font-weight: 600;
            white-space: nowrap;
          }

          .receipt-summary {
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #999;
          }

          .receipt-summary-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
            margin-bottom: 4px;
            font-size: 10px;
          }

          .receipt-summary-label {
            color: #666;
          }

          .receipt-summary-value {
            text-align: right;
            font-weight: 600;
            color: #333;
          }

          .receipt-total-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
            padding: 6px 0;
            font-size: 11px;
            font-weight: bold;
            color: #2196F3;
            border-top: 1px solid #999;
            border-bottom: 1px solid #999;
          }

          .receipt-total-label {
            color: #333;
          }

          .receipt-total-value {
            text-align: right;
            color: #2196F3;
          }

          .receipt-payment-info {
            margin-bottom: 12px;
            padding: 8px;
            background-color: #f9f9f9;
            border-radius: 3px;
            font-size: 10px;
          }

          .receipt-payment-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
            margin-bottom: 3px;
          }

          .receipt-payment-label {
            color: #666;
          }

          .receipt-payment-value {
            text-align: right;
            font-weight: 600;
            color: #333;
          }

          .receipt-footer {
            text-align: center;
            padding-top: 8px;
            border-top: 1px dashed #999;
            font-size: 9px;
            color: #999;
          }

          .receipt-message {
            text-align: center;
            margin-top: 8px;
            font-style: italic;
            color: #666;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .receipt-container {
              width: 100%;
              max-width: 80mm;
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      // Optional: close window after printing
      // printWindow.close();
    }, 250);

    console.log('🖨️ Receipt sent to printer');
  }

  /**
   * Close receipt modal
   */
  closeReceipt() {
    const modal = document.getElementById('receiptModal');
    if (modal) {
      modal.classList.remove('active');
      this.currentReceipt = null;
    }
  }

  /**
   * Download receipt as PDF (requires additional library)
   */
  downloadReceiptPDF() {
    if (!this.currentReceipt) {
      console.warn('No receipt to download');
      return;
    }

    console.log('📥 Receipt PDF download would be implemented with a PDF library');
    // This would require jsPDF or similar library
    // For now, users can use the print dialog to save as PDF
  }

  /**
   * Format currency
   */
  formatCurrency(value) {
    if (!Number.isFinite(value)) return '0';
    return Math.round(value).toLocaleString('id-ID');
  }

  /**
   * Send receipt via email (mock implementation)
   */
  sendReceiptEmail(email) {
    if (!this.currentReceipt) {
      console.warn('No receipt to send');
      return;
    }

    console.log(`📧 Sending receipt to ${email}...`);
    // This would require backend implementation
    showToast(`Struk akan dikirim ke ${email}`, 'success');
  }

  /**
   * Share receipt via WhatsApp
   */
  shareViaWhatsApp() {
    if (!this.currentReceipt) {
      console.warn('No receipt to share');
      return;
    }

    const { transactionId, total, items } = this.currentReceipt;
    const itemsList = items.map(item => `${item.quantity}x ${item.name}`).join(', ');
    
    const message = `Terima kasih telah berbelanja! 🙏\n\nNo. Struk: #${transactionId}\nItem: ${itemsList}\nTotal: Rp ${this.formatCurrency(total)}\n\nBerbelanja lagi untuk diskon spesial!`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');

    console.log('💬 Receipt shared via WhatsApp');
  }
}

// Initialize global receipt manager
let receiptManager = new ReceiptManager({
  shopName: 'DigiCaf Coffee Shop',
  shopSubtitle: 'Kopi Premium - Nikmati Momen Terbaik Anda',
  shopAddress: 'Jl. Coffee Street No. 123, Kota Kopi',
  shopPhone: '0812-3456-7890'
});

console.log('✅ Receipt Manager initialized');
