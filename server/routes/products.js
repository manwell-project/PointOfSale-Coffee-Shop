const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

// GET all products
router.get('/', async (req, res, next) => {
  try {
    const products = await dbHelpers.all(`
      SELECT p.*, s.quantity, s.min_stock 
      FROM products p 
      LEFT JOIN stocks s ON p.id = s.product_id 
      ORDER BY p.created_at DESC
    `);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET product by category
router.get('/category/:category', async (req, res, next) => {
  try {
    const products = await dbHelpers.all(`
      SELECT p.*, s.quantity, s.min_stock 
      FROM products p 
      LEFT JOIN stocks s ON p.id = s.product_id 
      WHERE p.category = ? AND p.is_available = 1
      ORDER BY p.name ASC
    `, [req.params.category]);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET single product
router.get('/:id', async (req, res, next) => {
  try {
    const product = await dbHelpers.get(`
      SELECT p.*, s.quantity, s.min_stock 
      FROM products p 
      LEFT JOIN stocks s ON p.id = s.product_id 
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// POST create new product
router.post('/', async (req, res, next) => {
  try {
    const { name, category, price, description } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = await dbHelpers.run(
      'INSERT INTO products (name, category, price, description) VALUES (?, ?, ?, ?)',
      [name, category, price, description]
    );

    // Do NOT create a stocks row automatically anymore; products (menu) are separate from raw materials
    res.status(201).json({ 
      id: result.id, 
      name, 
      category, 
      price, 
      description
    });
  } catch (err) {
    next(err);
  }
});

// PUT update product
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, price, description, is_available } = req.body;
    
    // Check if product exists
    const product = await dbHelpers.get('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (is_available !== undefined) { updates.push('is_available = ?'); values.push(is_available ? 1 : 0); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await dbHelpers.run(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updated = await dbHelpers.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE product
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await dbHelpers.get('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await dbHelpers.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
