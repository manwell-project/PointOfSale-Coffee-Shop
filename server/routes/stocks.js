const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

function clampInt(value, { min, max, fallback }) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const intVal = Math.trunc(num);
  return Math.min(max, Math.max(min, intVal));
}

// GET all stocks
router.get('/', async (req, res, next) => {
  try {
    const { data: stocks, error } = await supabase
      .from('raw_stocks')
      .select(`
        *,
        raw_materials!inner (name, category, price, sku, unit)
      `);

    if (error) throw error;

    const formatted = stocks.map(s => {
      const rm = Array.isArray(s.raw_materials) ? s.raw_materials[0] : s.raw_materials;
      return {
        ...s,
        name: rm?.name,
        category: rm?.category,
        price: rm?.price,
        sku: rm?.sku,
        unit: rm?.unit,
        raw_materials: undefined
      };
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET low stock items
router.get('/low-stock/list', async (req, res, next) => {
  try {
    const { data: stocks, error } = await supabase
      .from('raw_stocks')
      .select(`
        *,
        raw_materials!inner (name, category, price, sku, unit)
      `);

    if (error) throw error;

    const formatted = stocks
      .filter(s => s.quantity <= s.min_stock)
      .map(s => {
        const rm = Array.isArray(s.raw_materials) ? s.raw_materials[0] : s.raw_materials;
        return {
          ...s,
          name: rm?.name,
          category: rm?.category,
          price: rm?.price,
          sku: rm?.sku,
          unit: rm?.unit,
          raw_materials: undefined
        };
      })
      .sort((a, b) => a.quantity - b.quantity);

    res.json(formatted);
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

    let query = supabase
      .from('raw_stock_history')
      .select(`
        id,
        raw_material_id,
        quantity_before,
        quantity_after,
        change_reason,
        changed_by_employee_id,
        changed_at,
        raw_materials (name, category),
        employees (name)
      `)
      .order('changed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (materialId !== null && Number.isFinite(materialId)) {
      query = query.eq('raw_material_id', materialId);
    }

    const { data: history, error } = await query;
    if (error) throw error;

    const formatted = history.map(h => {
      const rm = Array.isArray(h.raw_materials) ? h.raw_materials[0] : h.raw_materials;
      const emp = Array.isArray(h.employees) ? h.employees[0] : h.employees;
      return {
        ...h,
        material_name: rm?.name,
        material_category: rm?.category,
        employee_name: emp?.name,
        delta: h.quantity_after - h.quantity_before,
        raw_materials: undefined,
        employees: undefined
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET stock history (single material)
router.get('/product/:product_id/history', async (req, res, next) => {
  try {
    const { data: history, error } = await supabase
      .from('raw_stock_history')
      .select(`
        *,
        employees (name)
      `)
      .eq('raw_material_id', req.params.product_id)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    const formatted = history.map(h => {
      const emp = Array.isArray(h.employees) ? h.employees[0] : h.employees;
      return {
        ...h,
        employee_name: emp?.name,
        employees: undefined
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET single stock
router.get('/:id', async (req, res, next) => {
  try {
    const { data: stock, error } = await supabase
      .from('raw_stocks')
      .select(`
        *,
        raw_materials!inner (name, category, price, sku, unit)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Stock not found' });
      throw error;
    }

    const rm = Array.isArray(stock.raw_materials) ? stock.raw_materials[0] : stock.raw_materials;
    res.json({
      ...stock,
      name: rm?.name,
      category: rm?.category,
      price: rm?.price,
      sku: rm?.sku,
      unit: rm?.unit,
      raw_materials: undefined
    });
  } catch (err) {
    next(err);
  }
});

// PUT update stock (add/reduce quantity)
router.put('/:id', async (req, res, next) => {
  try {
    const { quantity, min_stock, change_reason, employee_id, expiry_date } = req.body;
    const id = req.params.id;

    const { data: stock, error: fetchErr } = await supabase
      .from('raw_stocks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Stock not found' });
      throw fetchErr;
    }

    const updates = {};
    if (quantity !== undefined) updates.quantity = quantity;
    if (min_stock !== undefined) updates.min_stock = min_stock;
    if (expiry_date !== undefined) updates.expiry_date = expiry_date;
    updates.last_updated = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('raw_stocks')
      .update(updates)
      .eq('id', id);

    if (updateErr) throw updateErr;

    // Log stock history
    if (quantity !== undefined && quantity !== stock.quantity) {
      const delta = Number(quantity) - Number(stock.quantity);
      const reasonFromClient = typeof change_reason === 'string' ? change_reason.trim() : '';
      const defaultReason = delta > 0 ? 'Stok masuk' : delta < 0 ? 'Penyesuaian stok' : 'Manual adjustment';

      const { error: histErr } = await supabase
        .from('raw_stock_history')
        .insert([{
          raw_material_id: stock.raw_material_id,
          quantity_before: stock.quantity,
          quantity_after: quantity,
          change_reason: reasonFromClient || defaultReason,
          changed_by_employee_id: employee_id || null
        }]);
        
      if (histErr) throw histErr;
    }

    // Fetch updated record with relations
    const { data: updated, error: refetchErr } = await supabase
      .from('raw_stocks')
      .select(`
        *,
        raw_materials!inner (name, category, price, sku, unit)
      `)
      .eq('id', id)
      .single();

    if (refetchErr) throw refetchErr;

    const rm = Array.isArray(updated.raw_materials) ? updated.raw_materials[0] : updated.raw_materials;
    res.json({
      ...updated,
      name: rm?.name,
      category: rm?.category,
      price: rm?.price,
      sku: rm?.sku,
      unit: rm?.unit,
      raw_materials: undefined
    });
  } catch (err) {
    next(err);
  }
});

// POST create new raw material + raw_stock
router.post('/', async (req, res, next) => {
  try {
    const { name, quantity = 0, min_stock = 0, category = 'Raw Material', price = 0, description = '', sku = null, unit = null, expiry_date = null } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });

    // Insert into raw_materials
    const { data: rawMaterial, error: rmErr } = await supabase
      .from('raw_materials')
      .insert([{ name, category, price, description, sku, unit }])
      .select()
      .single();

    if (rmErr) throw rmErr;
    const rawMaterialId = rawMaterial.id;

    // Insert into raw_stocks
    const { data: rawStock, error: rsErr } = await supabase
      .from('raw_stocks')
      .insert([{ raw_material_id: rawMaterialId, quantity, min_stock, expiry_date }])
      .select()
      .single();

    if (rsErr) throw rsErr;

    // Insert history
    const initialQty = Number(quantity) || 0;
    const { error: histErr } = await supabase
      .from('raw_stock_history')
      .insert([{
        raw_material_id: rawMaterialId,
        quantity_before: 0,
        quantity_after: initialQty,
        change_reason: initialQty > 0 ? 'Stok masuk' : 'Stok awal',
        changed_by_employee_id: null
      }]);

    if (histErr) throw histErr;

    res.status(201).json({
      ...rawStock,
      name: rawMaterial.name,
      category: rawMaterial.category,
      price: rawMaterial.price,
      sku: rawMaterial.sku,
      unit: rawMaterial.unit,
      raw_material_id: rawMaterialId
    });
  } catch (err) {
    next(err);
  }
});

// GET stock by SKU
router.get('/sku/:sku', async (req, res, next) => {
  try {
    const { data: stocks, error } = await supabase
      .from('raw_stocks')
      .select(`
        *,
        raw_materials!inner (name, category, price, sku, unit)
      `)
      .eq('raw_materials.sku', req.params.sku);

    if (error) throw error;
    
    // inner join with eq on related table might return empty array if no match
    if (!stocks || stocks.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const stock = stocks[0];
    const rm = Array.isArray(stock.raw_materials) ? stock.raw_materials[0] : stock.raw_materials;
    
    res.json({
      ...stock,
      name: rm?.name,
      category: rm?.category,
      price: rm?.price,
      sku: rm?.sku,
      unit: rm?.unit,
      raw_materials: undefined
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
