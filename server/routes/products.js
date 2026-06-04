const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');
const path = require('path');
const fs = require('fs');

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
    const { name, category, price, description, barcode } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Check if barcode already exists
    if (barcode) {
      const existing = await dbHelpers.get('SELECT id FROM products WHERE barcode = ?', [barcode]);
      if (existing) {
        return res.status(400).json({ error: 'Barcode already exists' });
      }
    }

    const result = await dbHelpers.run(
      'INSERT INTO products (name, category, price, description, barcode) VALUES (?, ?, ?, ?, ?)',
      [name, category, price, description, barcode || null]
    );

    // Do NOT create a stocks row automatically anymore; products (menu) are separate from raw materials
    res.status(201).json({ 
      id: result.id, 
      name, 
      category, 
      price, 
      description,
      barcode
    });
  } catch (err) {
    next(err);
  }
});

// PUT update product
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, price, description, is_available, barcode } = req.body;
    
    // Check if product exists
    const product = await dbHelpers.get('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if new barcode already exists for another product
    if (barcode !== undefined && barcode !== null) {
      const existing = await dbHelpers.get(
        'SELECT id FROM products WHERE barcode = ? AND id != ?', 
        [barcode, req.params.id]
      );
      if (existing) {
        return res.status(400).json({ error: 'Barcode already exists for another product' });
      }
    }

    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (is_available !== undefined) { updates.push('is_available = ?'); values.push(is_available ? 1 : 0); }
    if (barcode !== undefined) { updates.push('barcode = ?'); values.push(barcode || null); }
    
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

// GET product by barcode (for POS barcode scanning)
router.get('/barcode/:barcode', async (req, res, next) => {
  try {
    const product = await dbHelpers.get(`
      SELECT p.*, s.quantity, s.min_stock 
      FROM products p 
      LEFT JOIN stocks s ON p.id = s.product_id 
      WHERE p.barcode = ?
    `, [req.params.barcode]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found', barcode: req.params.barcode });
    }
    res.json(product);
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

// New endpoint: upload product image (accepts base64 data or image URL)
router.post('/:id/image', async (req, res, next) => {
  try {
    const product = await dbHelpers.get('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { imageBase64, imageUrl } = req.body;

    let finalUrl = null;

    if (imageUrl) {
      // normalize incoming URL to be absolute from server root
      if (typeof imageUrl === 'string' && imageUrl.trim().length) {
        finalUrl = imageUrl.trim();
        if (!finalUrl.startsWith('/')) finalUrl = '/' + finalUrl.replace(/^\.\//, '');
      }
    } else if (imageBase64) {
      // Save base64 to public/uploads/products/<id>.png
      const uploadsDir = path.join(__dirname, '..', '..', 'Transaksi', 'images', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ error: 'Invalid base64 image' });
      const ext = matches[1].split('/')[1] || 'png';
      const data = matches[2];
      const filename = `product-${req.params.id}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
      // Use absolute path so browser can request `/Transaksi/images/uploads/...`
      finalUrl = `/Transaksi/images/uploads/${filename}`;
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }

    await dbHelpers.run('UPDATE products SET image_url = ? WHERE id = ?', [finalUrl, req.params.id]);
    const updated = await dbHelpers.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
