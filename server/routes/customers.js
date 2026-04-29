const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

// GET all customers with aggregated stats (total_transactions, total_spent)
router.get('/', async (req, res, next) => {
  try {
    const customers = await dbHelpers.all(`
      SELECT
        c.*,
        COALESCE(COUNT(t.id), 0) AS total_transactions,
        COALESCE(SUM(t.total_amount), 0) AS total_spent,
        MAX(t.created_at) AS last_purchase_date,
        CASE
          WHEN COALESCE(COUNT(t.id),0) > 10 THEN 'vip'
          WHEN COALESCE(COUNT(t.id),0) > 5 THEN 'reguler'
          ELSE 'reguler'
        END AS computed_type
      FROM customers c
      LEFT JOIN transactions t ON t.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    // Normalize numeric fields and compute type from aggregated value
    const normalized = customers.map(c => ({
      ...c,
      total_transactions: Number(c.total_transactions || 0),
      total_spent: Number(c.total_spent || 0),
      type: c.computed_type || 'reguler'
    }));

    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

// GET single customer
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await dbHelpers.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// GET customer by phone
router.get('/phone/:phone', async (req, res, next) => {
  try {
    const customer = await dbHelpers.get('SELECT * FROM customers WHERE phone = ?', [req.params.phone]);
    res.json(customer || null);
  } catch (err) {
    next(err);
  }
});

// POST create new customer
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (phone) {
      const existing = await dbHelpers.get('SELECT id FROM customers WHERE phone = ?', [phone]);
      if (existing) {
        return res.status(409).json({ error: 'Customer with this phone already exists' });
      }
    }

    // Insert into existing schema columns (no `type` column in schema)
    const result = await dbHelpers.run(
      'INSERT INTO customers (name, phone, email, address, total_transactions, total_spent) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone || null, email || null, null, 0, 0]
    );

    res.status(201).json({ 
      id: result.id,
      name,
      phone: phone || null,
      email: email || null,
      total_transactions: 0,
      total_spent: 0
    });
  } catch (err) {
    next(err);
  }
});

// PUT update customer
router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;
    
    const customer = await dbHelpers.get('SELECT id FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await dbHelpers.run(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updated = await dbHelpers.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE customer
router.delete('/:id', async (req, res, next) => {
  try {
    const customer = await dbHelpers.get('SELECT id FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await dbHelpers.run('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
