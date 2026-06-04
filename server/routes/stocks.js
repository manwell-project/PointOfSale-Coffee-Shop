const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

function clampInt(value, { min, max, fallback }) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const intVal = Math.trunc(num);
  return Math.min(max, Math.max(min, intVal));
}

// GET all stocks
router.get('/', async (req, res, next) => {
  try {
    // List raw material stocks (separate from menu products)
    const stocks = await dbHelpers.all(`
      SELECT rs.*, rm.name, rm.category, rm.price, rm.sku, rm.unit
      FROM raw_stocks rs
      JOIN raw_materials rm ON rs.raw_material_id = rm.id
      ORDER BY rm.name ASC
    `);
    res.json(stocks);
  } catch (err) {
    next(err);
  }
});

// GET low stock items
router.get('/low-stock/list', async (req, res, next) => {
  try {
    const lowStocks = await dbHelpers.all(`
      SELECT rs.*, rm.name, rm.category, rm.price, rm.sku, rm.unit
      FROM raw_stocks rs
      JOIN raw_materials rm ON rs.raw_material_id = rm.id
      WHERE rs.quantity <= rs.min_stock
      ORDER BY rs.quantity ASC
    `);
    res.json(lowStocks);
  } catch (err) {
    next(err);
  }
});

// GET stock history (all materials)
router.get('/history', async (req, res, next) => {
  try {
    const limit = clampInt(req.query.limit, { min: 1, max: 500, fallback: 200 });
    const offset = clampInt(req.query.offset, { min: 0, max: 1000000, fallback: 0 });
    const materialIdRaw = req.query.material_id;
    const materialId = materialIdRaw !== undefined && materialIdRaw !== '' ? Number(materialIdRaw) : null;

    const where = [];
    const params = [];
    if (materialId !== null && Number.isFinite(materialId)) {
      where.push('rsh.raw_material_id = ?');
      params.push(materialId);
    }

    const history = await dbHelpers.all(
      `
      SELECT
        rsh.id,
        rsh.raw_material_id,
        rm.name AS material_name,
        rm.category AS material_category,
        rsh.quantity_before,
        rsh.quantity_after,
        (rsh.quantity_after - rsh.quantity_before) AS delta,
        rsh.change_reason,
        rsh.changed_by_employee_id,
        rsh.changed_at,
        e.name AS employee_name
      FROM raw_stock_history rsh
      JOIN raw_materials rm ON rsh.raw_material_id = rm.id
      LEFT JOIN employees e ON rsh.changed_by_employee_id = e.id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY rsh.changed_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json(history);
  } catch (err) {
    next(err);
  }
});

// GET stock history (single material)
// Note: despite the "/product" prefix, this refers to raw_material_id for raw stock history.
// Keep this path for backward compatibility with the frontend API helper.
router.get('/product/:product_id/history', async (req, res, next) => {
  try {
    const history = await dbHelpers.all(`
      SELECT rsh.*, e.name as employee_name
      FROM raw_stock_history rsh
      LEFT JOIN employees e ON rsh.changed_by_employee_id = e.id
      WHERE rsh.raw_material_id = ?
      ORDER BY rsh.changed_at DESC
    `, [req.params.product_id]);
    
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// GET single stock
router.get('/:id', async (req, res, next) => {
  try {
    const stock = await dbHelpers.get(`
      SELECT rs.*, rm.name, rm.category, rm.price, rm.sku, rm.unit
      FROM raw_stocks rs
      JOIN raw_materials rm ON rs.raw_material_id = rm.id
      WHERE rs.id = ?
    `, [req.params.id]);
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json(stock);
  } catch (err) {
    next(err);
  }
});

// PUT update stock (add/reduce quantity)
router.put('/:id', async (req, res, next) => {
  try {
    const { quantity, min_stock, change_reason, employee_id, expiry_date } = req.body;

    const stock = await dbHelpers.get('SELECT * FROM raw_stocks WHERE id = ?', [req.params.id]);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const updates = [];
    const values = [];
    
    if (quantity !== undefined) { 
      updates.push('quantity = ?'); 
      values.push(quantity);
    }
    if (min_stock !== undefined) { 
      updates.push('min_stock = ?'); 
      values.push(min_stock);
    }
    if (expiry_date !== undefined) {
      updates.push('expiry_date = ?');
      values.push(expiry_date);
    }
    
    updates.push('last_updated = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await dbHelpers.run(
      `UPDATE raw_stocks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Log stock history if quantity changed
    if (quantity !== undefined && quantity !== stock.quantity) {
      const delta = Number(quantity) - Number(stock.quantity);
      const reasonFromClient = typeof change_reason === 'string' ? change_reason.trim() : '';
      const defaultReason = delta > 0
        ? 'Stok masuk'
        : delta < 0
          ? 'Penyesuaian stok'
          : 'Manual adjustment';

      await dbHelpers.run(
        'INSERT INTO raw_stock_history (raw_material_id, quantity_before, quantity_after, change_reason, changed_by_employee_id) VALUES (?, ?, ?, ?, ?)',
        [stock.raw_material_id, stock.quantity, quantity, reasonFromClient || defaultReason, employee_id || null]
      );
    }

    const updated = await dbHelpers.get(`
      SELECT rs.*, rm.name, rm.category, rm.price, rm.sku, rm.unit
      FROM raw_stocks rs
      JOIN raw_materials rm ON rs.raw_material_id = rm.id
      WHERE rs.id = ?
    `, [req.params.id]);
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST create new raw material + raw_stock
router.post('/', async (req, res, next) => {
  try {
    const { name, quantity = 0, min_stock = 0, category = 'Raw Material', price = 0, description = '', sku = null, unit = null, expiry_date = null } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });

    // Create raw_material then raw_stock in a transaction
    const queries = [
      { sql: 'INSERT INTO raw_materials (name, category, price, description, sku, unit) VALUES (?, ?, ?, ?, ?, ?)', params: [name, category, price, description, sku, unit] }
    ];

    const results = await dbHelpers.transaction(queries);
    const rawMaterialId = results[0].id;

    const stockRes = await dbHelpers.run(
      'INSERT INTO raw_stocks (raw_material_id, quantity, min_stock, expiry_date) VALUES (?, ?, ?, ?)',
      [rawMaterialId, quantity, min_stock, expiry_date]
    );

    // Log initial stock so "barang masuk" is visible in Riwayat Stok.
    const initialQty = Number(quantity) || 0;
    await dbHelpers.run(
      'INSERT INTO raw_stock_history (raw_material_id, quantity_before, quantity_after, change_reason, changed_by_employee_id) VALUES (?, ?, ?, ?, ?)',
      [rawMaterialId, 0, initialQty, initialQty > 0 ? 'Stok masuk' : 'Stok awal', null]
    );

    const created = await dbHelpers.get('SELECT rs.*, rm.name, rm.category, rm.price, rm.sku, rm.unit, rm.id as raw_material_id FROM raw_stocks rs JOIN raw_materials rm ON rs.raw_material_id = rm.id WHERE rs.id = ?', [stockRes.id]);

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET stock by SKU
router.get('/sku/:sku', async (req, res, next) => {
  try {
    const stock = await dbHelpers.get(`
      SELECT rs.*, rm.name, rm.category, rm.price, rm.sku, rm.unit
      FROM raw_stocks rs
      JOIN raw_materials rm ON rs.raw_material_id = rm.id
      WHERE rm.sku = ?
    `, [req.params.sku]);
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json(stock);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
