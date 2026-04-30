const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

function toIsoOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function computeDiscountedPrice(price, type, value) {
  const base = Number(price) || 0;
  const amount = Number(value) || 0;

  if (type === 'percentage') {
    return Math.max(0, Math.round(base - (base * amount) / 100));
  }

  return Math.max(0, Math.round(base - amount));
}

function isDiscountCurrentlyActive(discount) {
  if (!discount || Number(discount.is_active) !== 1) return false;

  const now = Date.now();
  const start = discount.start_date ? new Date(discount.start_date).getTime() : null;
  const end = discount.end_date ? new Date(discount.end_date).getTime() : null;

  if (start && now < start) return false;
  if (end && now > end) return false;

  return true;
}

async function getDiscountById(id) {
  const discount = await dbHelpers.get(
    `SELECT d.*, p.name AS product_name, p.price AS product_price
     FROM discounts d
     JOIN products p ON p.id = d.product_id
     WHERE d.id = ?`,
    [id]
  );

  if (!discount) return null;

  const discounted_price = computeDiscountedPrice(
    discount.product_price,
    discount.discount_type,
    discount.discount_value
  );

  return {
    ...discount,
    discounted_price,
    is_currently_active: isDiscountCurrentlyActive(discount)
  };
}

// GET all discounts
router.get('/', async (req, res, next) => {
  try {
    const rows = await dbHelpers.all(
      `SELECT d.*, p.name AS product_name, p.price AS product_price
       FROM discounts d
       JOIN products p ON p.id = d.product_id
       ORDER BY d.created_at DESC`
    );

    const mapped = rows.map((discount) => ({
      ...discount,
      discounted_price: computeDiscountedPrice(
        discount.product_price,
        discount.discount_type,
        discount.discount_value
      ),
      is_currently_active: isDiscountCurrentlyActive(discount)
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

// GET active discounts list
router.get('/active/list', async (req, res, next) => {
  try {
    const nowIso = new Date().toISOString();
    const rows = await dbHelpers.all(
      `SELECT d.*, p.name AS product_name, p.price AS product_price
       FROM discounts d
       JOIN products p ON p.id = d.product_id
       WHERE d.is_active = 1
         AND (d.start_date IS NULL OR d.start_date <= ?)
         AND (d.end_date IS NULL OR d.end_date >= ?)
       ORDER BY d.created_at DESC`,
      [nowIso, nowIso]
    );

    const mapped = rows.map((discount) => ({
      ...discount,
      discounted_price: computeDiscountedPrice(
        discount.product_price,
        discount.discount_type,
        discount.discount_value
      ),
      is_currently_active: true
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

// GET discount by id
router.get('/:id', async (req, res, next) => {
  try {
    const discount = await getDiscountById(req.params.id);

    if (!discount) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    res.json(discount);
  } catch (err) {
    next(err);
  }
});

// POST create discount
router.post('/', async (req, res, next) => {
  try {
    const {
      product_id,
      discount_type,
      discount_value,
      start_date,
      end_date,
      is_active,
      notes
    } = req.body;

    if (!product_id || !discount_type || discount_value === undefined) {
      return res.status(400).json({
        error: 'product_id, discount_type, and discount_value are required'
      });
    }

    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ error: 'discount_type must be percentage or fixed' });
    }

    const numericValue = Number(discount_value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return res.status(400).json({ error: 'discount_value must be greater than 0' });
    }

    if (discount_type === 'percentage' && numericValue > 100) {
      return res.status(400).json({ error: 'percentage discount cannot exceed 100' });
    }

    const product = await dbHelpers.get(
      'SELECT id, price FROM products WHERE id = ?',
      [product_id]
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (discount_type === 'fixed' && numericValue > Number(product.price || 0)) {
      return res.status(400).json({ error: 'fixed discount cannot exceed product price' });
    }

    const startIso = toIsoOrNull(start_date);
    const endIso = toIsoOrNull(end_date);

    if (start_date && !startIso) {
      return res.status(400).json({ error: 'Invalid start_date format' });
    }

    if (end_date && !endIso) {
      return res.status(400).json({ error: 'Invalid end_date format' });
    }

    if (startIso && endIso && new Date(startIso) > new Date(endIso)) {
      return res.status(400).json({ error: 'end_date must be after start_date' });
    }

    const result = await dbHelpers.run(
      `INSERT INTO discounts
       (product_id, discount_type, discount_value, start_date, end_date, is_active, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        discount_type,
        Math.round(numericValue),
        startIso,
        endIso,
        is_active === undefined ? 1 : (is_active ? 1 : 0),
        notes || null
      ]
    );

    const created = await getDiscountById(result.id);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT update discount
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await dbHelpers.get('SELECT * FROM discounts WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    const updates = [];
    const params = [];

    if (req.body.product_id !== undefined) {
      const product = await dbHelpers.get('SELECT id, price FROM products WHERE id = ?', [req.body.product_id]);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      updates.push('product_id = ?');
      params.push(req.body.product_id);
    }

    const nextType = req.body.discount_type !== undefined ? req.body.discount_type : existing.discount_type;
    if (req.body.discount_type !== undefined) {
      if (!['percentage', 'fixed'].includes(req.body.discount_type)) {
        return res.status(400).json({ error: 'discount_type must be percentage or fixed' });
      }
      updates.push('discount_type = ?');
      params.push(req.body.discount_type);
    }

    const nextValue = req.body.discount_value !== undefined
      ? Number(req.body.discount_value)
      : Number(existing.discount_value);

    if (req.body.discount_value !== undefined) {
      if (!Number.isFinite(nextValue) || nextValue <= 0) {
        return res.status(400).json({ error: 'discount_value must be greater than 0' });
      }
      updates.push('discount_value = ?');
      params.push(Math.round(nextValue));
    }

    if (nextType === 'percentage' && nextValue > 100) {
      return res.status(400).json({ error: 'percentage discount cannot exceed 100' });
    }

    const productIdForValidation = req.body.product_id !== undefined
      ? req.body.product_id
      : existing.product_id;
    const productForValidation = await dbHelpers.get('SELECT price FROM products WHERE id = ?', [productIdForValidation]);
    if (nextType === 'fixed' && nextValue > Number(productForValidation?.price || 0)) {
      return res.status(400).json({ error: 'fixed discount cannot exceed product price' });
    }

    if (req.body.start_date !== undefined) {
      const startIso = toIsoOrNull(req.body.start_date);
      if (req.body.start_date && !startIso) {
        return res.status(400).json({ error: 'Invalid start_date format' });
      }
      updates.push('start_date = ?');
      params.push(startIso);
    }

    if (req.body.end_date !== undefined) {
      const endIso = toIsoOrNull(req.body.end_date);
      if (req.body.end_date && !endIso) {
        return res.status(400).json({ error: 'Invalid end_date format' });
      }
      updates.push('end_date = ?');
      params.push(endIso);
    }

    const startForCompare = req.body.start_date !== undefined
      ? toIsoOrNull(req.body.start_date)
      : existing.start_date;
    const endForCompare = req.body.end_date !== undefined
      ? toIsoOrNull(req.body.end_date)
      : existing.end_date;

    if (startForCompare && endForCompare && new Date(startForCompare) > new Date(endForCompare)) {
      return res.status(400).json({ error: 'end_date must be after start_date' });
    }

    if (req.body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(req.body.is_active ? 1 : 0);
    }

    if (req.body.notes !== undefined) {
      updates.push('notes = ?');
      params.push(req.body.notes || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    await dbHelpers.run(
      `UPDATE discounts SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await getDiscountById(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE discount
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await dbHelpers.get('SELECT id FROM discounts WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    await dbHelpers.run('DELETE FROM discounts WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Discount deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
