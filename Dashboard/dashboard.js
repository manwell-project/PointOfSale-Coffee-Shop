/**
 * Dashboard Script - Phase 4 Implementation
 * Enhanced real-time data sync from API
 * Features: Revenue tracking, transaction count, top products, low stock alerts
 * Updated with new CSS structure and components
 */

console.log('📊 Dashboard v2.0 - Phase 4 Implementation');

// Note: Main dashboard functionality is now in index.html inline script
// This file serves as a fallback/compatibility layer for legacy code

// Helper function for legacy compatibility
if (typeof formatRupiah === 'undefined') {
  window.formatRupiah = function(amount) {
    if (!amount && amount !== 0) return 'Rp 0';
    return 'Rp ' + Number(amount).toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatRupiah
  };
}
