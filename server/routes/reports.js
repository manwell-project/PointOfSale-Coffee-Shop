const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

// GET daily report
router.get('/daily', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const report = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_transaction
      FROM transactions
      WHERE DATE(created_at) = ?
    `, [today]);

    const topProducts = await dbHelpers.all(`
      SELECT 
        p.id,
        p.name,
        p.category,
        SUM(ti.quantity) as qty_sold,
        SUM(ti.subtotal) as revenue
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE DATE(t.created_at) = ?
      GROUP BY p.id
      ORDER BY qty_sold DESC
      LIMIT 10
    `, [today]);

    res.json({
      date: today,
      summary: report,
      top_products: topProducts
    });
  } catch (err) {
    next(err);
  }
});

// GET monthly report
router.get('/monthly', async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const report = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_transaction
      FROM transactions
      WHERE strftime('%Y-%m', created_at) = ?
    `, [`${year}-${month}`]);

    const topProducts = await dbHelpers.all(`
      SELECT 
        p.id,
        p.name,
        p.category,
        SUM(ti.quantity) as qty_sold,
        SUM(ti.subtotal) as revenue
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE strftime('%Y-%m', t.created_at) = ?
      GROUP BY p.id
      ORDER BY qty_sold DESC
    `, [`${year}-${month}`]);

    res.json({
      period: `${year}-${month}`,
      summary: report,
      top_products: topProducts
    });
  } catch (err) {
    next(err);
  }
});

// GET product best sellers
router.get('/products/bestsellers', async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;
    
    const bestsellers = await dbHelpers.all(`
      SELECT 
        p.id,
        p.name,
        p.category,
        COUNT(DISTINCT ti.transaction_id) as times_sold,
        SUM(ti.quantity) as total_qty,
        SUM(ti.subtotal) as total_revenue,
        ROUND(AVG(ti.quantity), 2) as avg_qty_per_sale
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT ?
    `, [limit]);

    res.json(bestsellers);
  } catch (err) {
    next(err);
  }
});

// GET employee sales
router.get('/employees/sales', async (req, res, next) => {
  try {
    const sales = await dbHelpers.all(`
      SELECT 
        e.id,
        e.name,
        e.shift,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_sales,
        AVG(t.total_amount) as avg_transaction
      FROM transactions t
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE e.id IS NOT NULL
      GROUP BY e.id
      ORDER BY total_sales DESC
    `);

    res.json(sales);
  } catch (err) {
    next(err);
  }
});

// GET stock summary
router.get('/stocks/summary', async (req, res, next) => {
  try {
    const summary = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_products,
        SUM(quantity) as total_stock_qty,
        COUNT(CASE WHEN quantity <= min_stock THEN 1 END) as low_stock_count
      FROM stocks
    `);

    const lowStocks = await dbHelpers.all(`
      SELECT 
        p.id,
        p.name,
        p.category,
        s.quantity,
        s.min_stock,
        (s.min_stock - s.quantity) as shortage
      FROM stocks s
      JOIN products p ON s.product_id = p.id
      WHERE s.quantity <= s.min_stock
      ORDER BY shortage DESC
    `);

    res.json({
      summary,
      low_stocks: lowStocks
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
