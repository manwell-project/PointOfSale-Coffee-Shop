const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

// GET all employees
router.get('/', async (req, res, next) => {
  try {
    const employees = await dbHelpers.all(`
      SELECT * FROM employees 
      ORDER BY name ASC
    `);
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// GET employees by shift
router.get('/shift/:shift', async (req, res, next) => {
  try {
    const employees = await dbHelpers.all(`
      SELECT * FROM employees 
      WHERE shift = ? AND status = 'aktif'
      ORDER BY name ASC
    `, [req.params.shift]);
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// GET single employee
router.get('/:id', async (req, res, next) => {
  try {
    const employee = await dbHelpers.get('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

// POST create new employee
router.post('/', async (req, res, next) => {
  try {
    const { name, shift, phone, email } = req.body;
    
    if (!name || !shift) {
      return res.status(400).json({ error: 'Name and shift are required' });
    }

    const result = await dbHelpers.run(
      'INSERT INTO employees (name, shift, phone, email, status) VALUES (?, ?, ?, ?, ?)',
      [name, shift, phone || null, email || null, 'aktif']
    );

    res.status(201).json({ 
      id: result.id, 
      name, 
      shift, 
      phone, 
      email,
      status: 'aktif'
    });
  } catch (err) {
    next(err);
  }
});

// PUT update employee
router.put('/:id', async (req, res, next) => {
  try {
    const { name, shift, phone, email, status } = req.body;
    
    const employee = await dbHelpers.get('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (shift !== undefined) { updates.push('shift = ?'); values.push(shift); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await dbHelpers.run(
      `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updated = await dbHelpers.get('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE employee
router.delete('/:id', async (req, res, next) => {
  try {
    const employee = await dbHelpers.get('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await dbHelpers.run('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
