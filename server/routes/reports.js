const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

function getStartAndEndOfDay(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  const start = d.toISOString();
  d.setHours(23, 59, 59, 999);
  const end = d.toISOString();
  return { start, end };
}

function getStartAndEndOfMonth(year, month) {
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
  return { start, end };
}

// GET daily report
router.get('/daily', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { start, end } = getStartAndEndOfDay(today);
    
    // fetch transactions
    const { data: txs, error: tErr } = await supabase.from('transactions').select('*').gte('created_at', start).lte('created_at', end).eq('status', 'completed');
    if (tErr) throw tErr;

    const total_transactions = txs.length;
    const total_revenue = txs.reduce((sum, t) => sum + Number(t.total_amount), 0);
    const avg_transaction = total_transactions > 0 ? total_revenue / total_transactions : 0;

    // fetch items directly using join syntax
    const { data: items, error: iErr } = await supabase
      .from('transaction_items')
      .select('*, products(name, category), transactions!inner(created_at, status)')
      .gte('transactions.created_at', start)
      .lte('transactions.created_at', end)
      .eq('transactions.status', 'completed');

    if (iErr) throw iErr;

    const productMap = {};
    for (const item of items) {
      if (!productMap[item.product_id]) {
        const p = Array.isArray(item.products) ? item.products[0] : item.products;
        productMap[item.product_id] = {
          id: item.product_id,
          name: p ? p.name : null,
          category: p ? p.category : null,
          qty_sold: 0,
          revenue: 0
        };
      }
      productMap[item.product_id].qty_sold += item.quantity;
      productMap[item.product_id].revenue += item.quantity * item.unit_price;
    }

    const topProducts = Object.values(productMap).sort((a, b) => b.qty_sold - a.qty_sold).slice(0, 10);

    res.json({
      date: today,
      summary: { total_transactions, total_revenue, avg_transaction },
      top_products: topProducts
    });
  } catch (err) {
    next(err);
  }
});

// GET monthly report
router.get('/monthly', async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || (new Date().getMonth() + 1);
    const { start, end } = getStartAndEndOfMonth(year, month);
    const period = `${year}-${month.toString().padStart(2, '0')}`;
    
    const { data: txs, error: tErr } = await supabase.from('transactions').select('*').gte('created_at', start).lte('created_at', end).eq('status', 'completed');
    if (tErr) throw tErr;

    const total_transactions = txs.length;
    const total_revenue = txs.reduce((sum, t) => sum + Number(t.total_amount), 0);
    const avg_transaction = total_transactions > 0 ? total_revenue / total_transactions : 0;

    const { data: items, error: iErr } = await supabase
      .from('transaction_items')
      .select('*, products(name, category), transactions!inner(created_at, status)')
      .gte('transactions.created_at', start)
      .lte('transactions.created_at', end)
      .eq('transactions.status', 'completed');

    if (iErr) throw iErr;

    const productMap = {};
    for (const item of items) {
      if (!productMap[item.product_id]) {
        const p = Array.isArray(item.products) ? item.products[0] : item.products;
        productMap[item.product_id] = {
          id: item.product_id,
          name: p ? p.name : null,
          category: p ? p.category : null,
          qty_sold: 0,
          revenue: 0
        };
      }
      productMap[item.product_id].qty_sold += item.quantity;
      productMap[item.product_id].revenue += item.quantity * item.unit_price;
    }

    const topProducts = Object.values(productMap).sort((a, b) => b.qty_sold - a.qty_sold);

    res.json({
      period,
      summary: { total_transactions, total_revenue, avg_transaction },
      top_products: topProducts
    });
  } catch (err) {
    next(err);
  }
});

// GET product best sellers
router.get('/products/bestsellers', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    
    const { data: items, error } = await supabase.from('transaction_items').select('*, products(name, category)');
    if (error) throw error;

    const productMap = {};
    for (const item of items) {
      if (!productMap[item.product_id]) {
        const p = Array.isArray(item.products) ? item.products[0] : item.products;
        productMap[item.product_id] = {
          id: item.product_id,
          name: p ? p.name : null,
          category: p ? p.category : null,
          transaction_set: new Set(),
          total_qty: 0,
          total_revenue: 0
        };
      }
      productMap[item.product_id].transaction_set.add(item.transaction_id);
      productMap[item.product_id].total_qty += item.quantity;
      productMap[item.product_id].total_revenue += item.subtotal;
    }

    const bestsellers = Object.values(productMap).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      times_sold: p.transaction_set.size,
      total_qty: p.total_qty,
      total_revenue: p.total_revenue,
      avg_qty_per_sale: p.transaction_set.size > 0 ? Number((p.total_qty / p.transaction_set.size).toFixed(2)) : 0
    })).sort((a, b) => b.total_qty - a.total_qty).slice(0, limit);

    res.json(bestsellers);
  } catch (err) {
    next(err);
  }
});

// GET employee sales
router.get('/employees/sales', async (req, res, next) => {
  try {
    const { data: txs, error } = await supabase.from('transactions').select('*, employees(name, shift)').not('employee_id', 'is', null);
    if (error) throw error;

    const empMap = {};
    for (const t of txs) {
      if (!empMap[t.employee_id]) {
        const e = Array.isArray(t.employees) ? t.employees[0] : t.employees;
        empMap[t.employee_id] = {
          id: t.employee_id,
          name: e ? e.name : null,
          shift: e ? e.shift : null,
          transaction_count: 0,
          total_sales: 0
        };
      }
      empMap[t.employee_id].transaction_count += 1;
      empMap[t.employee_id].total_sales += Number(t.total_amount);
    }

    const sales = Object.values(empMap).map(e => ({
      ...e,
      avg_transaction: e.transaction_count > 0 ? e.total_sales / e.transaction_count : 0
    })).sort((a, b) => b.total_sales - a.total_sales);

    res.json(sales);
  } catch (err) {
    next(err);
  }
});

// GET stock summary
router.get('/stocks/summary', async (req, res, next) => {
  try {
    const { data: stocks, error } = await supabase.from('stocks').select('*, products(name, category)');
    if (error) throw error;

    let total_stock_qty = 0;
    let low_stock_count = 0;
    const low_stocks = [];

    for (const s of stocks) {
      total_stock_qty += s.quantity;
      if (s.quantity <= s.min_stock) {
        low_stock_count++;
        const p = Array.isArray(s.products) ? s.products[0] : s.products;
        low_stocks.push({
          id: s.product_id,
          name: p ? p.name : null,
          category: p ? p.category : null,
          quantity: s.quantity,
          min_stock: s.min_stock,
          shortage: s.min_stock - s.quantity
        });
      }
    }

    low_stocks.sort((a, b) => b.shortage - a.shortage);

    res.json({
      summary: {
        total_products: stocks.length,
        total_stock_qty,
        low_stock_count
      },
      low_stocks
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
