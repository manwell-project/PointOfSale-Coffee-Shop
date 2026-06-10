const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET all customers with stats
router.get('/', async (req, res, next) => {
  try {
    const { data: customers, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const normalized = customers.map(c => {
      let type = 'reguler';
      const txCount = Number(c.total_transactions || 0);
      if (txCount > 10) type = 'vip';
      else if (txCount > 5) type = 'reguler';
      return {
        ...c,
        total_transactions: txCount,
        total_spent: Number(c.total_spent || 0),
        type
      };
    });

    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

// GET single customer
router.get('/:id', async (req, res, next) => {
  try {
    const { data: customer, error } = await supabase.from('customers').select('*').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Customer not found' });
      throw error;
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// GET customer by phone
router.get('/phone/:phone', async (req, res, next) => {
  try {
    const { data: customer } = await supabase.from('customers').select('*').eq('phone', req.params.phone).maybeSingle();
    res.json(customer || null);
  } catch (err) {
    next(err);
  }
});

// POST create new customer
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    if (phone) {
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone).maybeSingle();
      if (existing) return res.status(409).json({ error: 'Customer with this phone already exists' });
    }

    const { data: result, error } = await supabase.from('customers').insert([{
      name, phone: phone || null, email: email || null, address: null, total_transactions: 0, total_spent: 0
    }]).select().single();

    if (error) throw error;
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// PUT update customer
router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;
    
    const { data: customer } = await supabase.from('customers').select('id').eq('id', req.params.id).maybeSingle();
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (address !== undefined) updates.address = address;
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 1) return res.status(400).json({ error: 'No fields to update' });

    const { data: updated, error } = await supabase.from('customers').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE customer
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: customer } = await supabase.from('customers').select('id').eq('id', req.params.id).maybeSingle();
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { error } = await supabase.from('customers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
