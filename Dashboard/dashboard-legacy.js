/**
 * Dashboard Script - LEGACY VERSION (Backup)
 * Sync data real-time dari API
 * Features: Revenue tracking, transaction count, top products, low stock alerts
 */

document.addEventListener('DOMContentLoaded', async function() {
  console.log('📊 Dashboard loaded, fetching data...');
  
  // Elements
  const revenueEl = document.querySelector('.stats-card:nth-child(1) .card-value');
  const transactionEl = document.querySelector('.stats-card:nth-child(2) .card-value');
  const topProductEl = document.querySelector('.stats-card:nth-child(3) .card-value');
  const lowStockEl = document.querySelector('.stats-card:nth-child(4) .card-value');
  const activityEl = document.querySelector('.section:nth-child(2) > div');
  
  // Load data
  await loadDashboardData();
  
  // Refresh setiap 10 detik
  setInterval(loadDashboardData, 10000);
  
  async function loadDashboardData() {
    try {
      // Get daily report
      const dailyReport = await API.Reports.getDaily();
      const stockSummary = await API.Reports.getStockSummary();
      
      // Update revenue
      if (revenueEl && dailyReport.summary) {
        const revenue = dailyReport.summary.total_revenue || 0;
        revenueEl.textContent = formatRupiah(revenue);
        revenueEl.style.color = revenue > 0 ? '#8B4513' : '#ccc';
      }
      
      // Update transaction count
      if (transactionEl && dailyReport.summary) {
        const count = dailyReport.summary.total_transactions || 0;
        transactionEl.textContent = count;
      }
      
      // Update top product
      if (topProductEl && dailyReport.top_products && dailyReport.top_products.length > 0) {
        const topProduct = dailyReport.top_products[0];
        topProductEl.textContent = topProduct.name;
        topProductEl.title = `${topProduct.qty_sold} sold`;
      }
      
      // Update low stock count
      if (lowStockEl && stockSummary.summary) {
        const lowCount = stockSummary.summary.low_stock_count || 0;
        lowStockEl.textContent = lowCount;
        lowStockEl.style.color = lowCount > 0 ? '#f44336' : '#8B4513';
      }
      
      // Update activity section with low stock alerts and top products
      if (activityEl) {
        let activityHTML = '';
        
        // Low Stock Alerts - PRIORITAS UTAMA
        if (stockSummary.summary && stockSummary.summary.low_stock_count > 0) {
          const lowStocks = stockSummary.summary.low_stocks || [];
          activityHTML += `
            <div style="margin-bottom:16px">
              <div style="margin-bottom:10px;padding:10px;background:#ffe8e8;border-left:4px solid #f44336;border-radius:4px">
                <strong style="color:#d32f2f">⚠️ PERINGATAN STOK RENDAH (${lowStocks.length} item)</strong>
              </div>
              ${lowStocks.slice(0, 5).map((item) => {
                const shortage = item.min_stock - item.quantity;
                let bgColor = item.quantity === 0 ? '#ffcdd2' : '#fff9c4';
                let borderColor = item.quantity === 0 ? '#c62828' : '#f57f17';
                let statusIcon = item.quantity === 0 ? '🔴 STOK HABIS' : '🟡 KRITIS';
                
                return `
                  <div style="padding:10px;background:${bgColor};border-left:3px solid ${borderColor};margin-bottom:8px;border-radius:3px">
                    <strong>${item.name}</strong>
                    <br>
                    <small>${statusIcon} | Stok: ${item.quantity} / Min: ${item.min_stock} (Kurang: ${shortage})</small>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }
        
        // Top Products
        if (dailyReport.top_products && dailyReport.top_products.length > 0) {
          activityHTML += `
            <div>
              <div style="margin-bottom:10px">
                <strong>🏆 Top Products Hari Ini:</strong>
              </div>
              ${dailyReport.top_products.slice(0, 5).map((p, i) => `
                <div style="padding:8px;border-left:3px solid #8B4513;margin-bottom:6px;background:#fafafa;border-radius:3px">
                  ${i+1}. <strong>${p.name}</strong>
                  <br>
                  <small>Terjual: ${p.qty_sold} | Revenue: ${formatRupiah(p.revenue)}</small>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          activityHTML += '<div style="color:#999;padding:12px">Belum ada transaksi hari ini</div>';
        }
        
        activityEl.innerHTML = activityHTML;
      }
      
      console.log('✅ Dashboard data updated');
    } catch (err) {
      console.error('❌ Error loading dashboard:', err.message);
      if (activityEl) {
        activityEl.innerHTML = `<div style="color:#f44336;padding:12px">⚠️ Error: ${err.message}</div>`;
      }
    }
  }
});
