const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const path = require('path');
const fs = require('fs');

// GET all products
router.get('/', async (req, res, next) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        stocks (quantity, min_stock)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = products.map(p => {
      const stockObj = Array.isArray(p.stocks) ? p.stocks[0] : p.stocks;
      return {
        ...p,
        quantity: stockObj ? stockObj.quantity : null,
        min_stock: stockObj ? stockObj.min_stock : null,
        stocks: undefined
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET product by category
router.get('/category/:category', async (req, res, next) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        stocks (quantity, min_stock)
      `)
      .eq('category', req.params.category)
      .eq('is_available', 1)
      .order('name', { ascending: true });

    if (error) throw error;

    const formatted = products.map(p => {
      const stockObj = Array.isArray(p.stocks) ? p.stocks[0] : p.stocks;
      return {
        ...p,
        quantity: stockObj ? stockObj.quantity : null,
        min_stock: stockObj ? stockObj.min_stock : null,
        stocks: undefined
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET single product
router.get('/:id', async (req, res, next) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        stocks (quantity, min_stock)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Product not found' });
      throw error;
    }

    const stockObj = Array.isArray(product.stocks) ? product.stocks[0] : product.stocks;
    const formatted = {
      ...product,
      quantity: stockObj ? stockObj.quantity : null,
      min_stock: stockObj ? stockObj.min_stock : null,
      stocks: undefined
    };

    res.json(formatted);
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
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', barcode)
        .single();
        
      if (existing) {
        return res.status(400).json({ error: 'Barcode already exists' });
      }
    }

    const { data: result, error } = await supabase
      .from('products')
      .insert([{ name, category, price, description, barcode: barcode || null }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// PUT update product
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, price, description, is_available, barcode } = req.body;
    const id = req.params.id;
    
    // Check if product exists
    const { data: product } = await supabase.from('products').select('id').eq('id', id).single();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if new barcode already exists for another product
    if (barcode !== undefined && barcode !== null) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', barcode)
        .neq('id', id)
        .single();
        
      if (existing) {
        return res.status(400).json({ error: 'Barcode already exists for another product' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (price !== undefined) updates.price = price;
    if (description !== undefined) updates.description = description;
    if (is_available !== undefined) updates.is_available = is_available ? 1 : 0;
    if (barcode !== undefined) updates.barcode = barcode || null;
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 1) { // only updated_at
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data: updated, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET product by barcode (for POS barcode scanning)
router.get('/barcode/:barcode', async (req, res, next) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        stocks (quantity, min_stock)
      `)
      .eq('barcode', req.params.barcode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Product not found', barcode: req.params.barcode });
      throw error;
    }

    const stockObj = Array.isArray(product.stocks) ? product.stocks[0] : product.stocks;
    const formatted = {
      ...product,
      quantity: stockObj ? stockObj.quantity : null,
      min_stock: stockObj ? stockObj.min_stock : null,
      stocks: undefined
    };

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// DELETE product
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: product } = await supabase.from('products').select('id').eq('id', req.params.id).single();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

// New endpoint: upload product image (accepts base64 data or image URL)
router.post('/:id/image', async (req, res, next) => {
  try {
    const { data: product } = await supabase.from('products').select('id').eq('id', req.params.id).single();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { imageBase64, imageUrl } = req.body;
    let finalUrl = null;

    if (imageUrl) {
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
      finalUrl = `/Transaksi/images/uploads/${filename}`;
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { data: updated, error } = await supabase
      .from('products')
      .update({ image_url: finalUrl })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
