const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const crypto = require('crypto');

function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

// GET all employees
router.get('/', async (req, res, next) => {
  try {
    const { data: employees, error } = await supabase.from('employees').select('*').order('name', { ascending: true });
    if (error) throw error;
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// GET employees by shift
router.get('/shift/:shift', async (req, res, next) => {
  try {
    const { data: employees, error } = await supabase.from('employees').select('*').eq('shift', req.params.shift).eq('status', 'aktif').order('name', { ascending: true });
    if (error) throw error;
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// GET single employee
router.get('/:id', async (req, res, next) => {
  try {
    const { data: employee, error } = await supabase.from('employees').select('*').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Employee not found' });
      throw error;
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

// POST create new employee
router.post('/', async (req, res, next) => {
  try {
    const { name, shift, phone, email, username, password, role, position, address, joinDate, status, notes } = req.body;

    if (!name || !shift) {
      return res.status(400).json({ error: 'Name and shift are required' });
    }

    if (username) {
      const { data: existing } = await supabase.from('employees').select('id').eq('username', username).maybeSingle();
      if (existing) {
        return res.status(400).json({ error: 'Username sudah dipakai' });
      }
    }

    const password_hash = password ? hashPassword(password) : null;

    const { data: result, error } = await supabase.from('employees').insert([{
      name, shift, phone: phone || null, email: email || null, status: status || 'aktif',
      username: username || null, password_hash, role: role || null, position: position || null,
      address: address || null, "joinDate": joinDate || null, notes: notes || null
    }]).select().single();

    if (error) throw error;
    res.status(201).json(result);
  } catch (err) {
    console.error('Detailed error in POST /employees:', err);
    next(err);
  }
});

// PUT update employee
router.put('/:id', async (req, res, next) => {
  try {
    const { name, shift, phone, email, status, username, password, role, position, address, joinDate, notes } = req.body;
    
    const { data: employee } = await supabase.from('employees').select('id').eq('id', req.params.id).maybeSingle();
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (shift !== undefined) updates.shift = shift;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (status !== undefined) updates.status = status;
    if (username !== undefined) updates.username = username || null;
    if (role !== undefined) updates.role = role || null;
    if (position !== undefined) updates.position = position || null;
    if (address !== undefined) updates.address = address || null;
    if (joinDate !== undefined) updates["joinDate"] = joinDate || null;
    if (notes !== undefined) updates.notes = notes || null;
    if (password !== undefined && password !== '') updates.password_hash = hashPassword(password);
    
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data: updated, error } = await supabase.from('employees').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE employee
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: employee } = await supabase.from('employees').select('id').eq('id', req.params.id).maybeSingle();
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { error } = await supabase.from('employees').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
