const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

// GET all customers
router.get('/', async (req, res, next) => {
  try {
    const customers = await dbHelpers.all(`
      SELECT * FROM customers 
      ORDER BY created_at DESC
    `);
    res.json(customers);
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
    const { name, phone, email, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if customer already exists
    if (phone) {
      const existing = await dbHelpers.get('SELECT id FROM customers WHERE phone = ?', [phone]);
      if (existing) {
        return res.status(409).json({ error: 'Customer with this phone already exists' });
      }
    }

    const result = await dbHelpers.run(
      'INSERT INTO customers (name, phone, email, address, total_transactions, total_spent) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone || null, email || null, address || null, 0, 0]
    );

    res.status(201).json({ 
      id: result.id, 
      name, 
      phone, 
      email,
      address,
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
