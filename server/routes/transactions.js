const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

// GET all transactions
router.get('/', async (req, res, next) => {
  try {
    const transactions = await dbHelpers.all(`
      SELECT t.*, c.name as customer_name, e.name as employee_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN employees e ON t.employee_id = e.id
      ORDER BY t.created_at DESC
    `);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// GET single transaction with items
router.get('/:id', async (req, res, next) => {
  try {
    const transaction = await dbHelpers.get(`
      SELECT t.*, c.name as customer_name, e.name as employee_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get items
    const items = await dbHelpers.all(`
      SELECT ti.*, p.name as product_name, p.category
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ?
    `, [req.params.id]);

    res.json({ ...transaction, items });
  } catch (err) {
    next(err);
  }
});

// POST create new transaction
router.post('/', async (req, res, next) => {
  try {
    const { items, customer_id, employee_id, payment_method, total_amount } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Transaction must have at least one item' });
    }

    // Create transaction
    const result = await dbHelpers.run(
      'INSERT INTO transactions (customer_id, employee_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
      [customer_id || null, employee_id || null, total_amount, payment_method || 'cash', 'completed']
    );

    const transactionId = result.id;

    // Insert items and update stock
    for (const item of items) {
      // Insert transaction item
      await dbHelpers.run(
        'INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [transactionId, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );

      // Reduce stock
      const stock = await dbHelpers.get('SELECT * FROM stocks WHERE product_id = ?', [item.product_id]);
      if (stock) {
        const newQuantity = stock.quantity - item.quantity;
        await dbHelpers.run(
          'UPDATE stocks SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?',
          [newQuantity, item.product_id]
        );

        // Log stock history
        await dbHelpers.run(
          'INSERT INTO stock_history (product_id, quantity_before, quantity_after, change_reason, changed_by_employee_id) VALUES (?, ?, ?, ?, ?)',
          [item.product_id, stock.quantity, newQuantity, 'Sold in transaction #' + transactionId, employee_id || null]
        );
      }
    }

    // Update customer stats
    if (customer_id) {
      await dbHelpers.run(
        'UPDATE customers SET total_transactions = total_transactions + 1, total_spent = total_spent + ? WHERE id = ?',
        [total_amount, customer_id]
      );
    }

    res.status(201).json({ 
      id: transactionId, 
      customer_id, 
      employee_id,
      total_amount,
      payment_method: payment_method || 'cash',
      status: 'completed',
      items
    });
  } catch (err) {
    next(err);
  }
});

// GET transactions for a specific date
router.get('/date/:date', async (req, res, next) => {
  try {
    const transactions = await dbHelpers.all(`
      SELECT t.*, c.name as customer_name, e.name as employee_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE DATE(t.created_at) = ?
      ORDER BY t.created_at DESC
    `, [req.params.date]);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// GET daily sales summary
router.get('/summary/daily', async (req, res, next) => {
  try {
    const summary = await dbHelpers.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_sales
      FROM transactions
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
