const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

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
  const { data: discount, error } = await supabase
    .from('discounts')
    .select('*, products(name, price)')
    .eq('id', id)
    .single();

  if (error || !discount) return null;

  const p = Array.isArray(discount.products) ? discount.products[0] : discount.products;
  const product_price = p ? p.price : 0;
  const discounted_price = computeDiscountedPrice(product_price, discount.discount_type, discount.discount_value);

  return {
    ...discount,
    product_name: p ? p.name : null,
    product_price,
    discounted_price,
    is_currently_active: isDiscountCurrentlyActive(discount),
    products: undefined
  };
}

// GET all discounts
router.get('/', async (req, res, next) => {
  try {
    const { data: discounts, error } = await supabase
      .from('discounts')
      .select('*, products(name, price)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = discounts.map((d) => {
      const p = Array.isArray(d.products) ? d.products[0] : d.products;
      const product_price = p ? p.price : 0;
      return {
        ...d,
        product_name: p ? p.name : null,
        product_price,
        discounted_price: computeDiscountedPrice(product_price, d.discount_type, d.discount_value),
        is_currently_active: isDiscountCurrentlyActive(d),
        products: undefined
      };
    });

    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

// GET active discounts list
router.get('/active/list', async (req, res, next) => {
  try {
    const { data: discounts, error } = await supabase
      .from('discounts')
      .select('*, products(name, price)')
      .eq('is_active', 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = discounts.filter(isDiscountCurrentlyActive).map((d) => {
      const p = Array.isArray(d.products) ? d.products[0] : d.products;
      const product_price = p ? p.price : 0;
      return {
        ...d,
        product_name: p ? p.name : null,
        product_price,
        discounted_price: computeDiscountedPrice(product_price, d.discount_type, d.discount_value),
        is_currently_active: true,
        products: undefined
      };
    });

    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

// GET discount by id
router.get('/:id', async (req, res, next) => {
  try {
    const discount = await getDiscountById(req.params.id);
    if (!discount) return res.status(404).json({ error: 'Discount not found' });
    res.json(discount);
  } catch (err) {
    next(err);
  }
});

// POST create discount
router.post('/', async (req, res, next) => {
  try {
    const { product_id, discount_type, discount_value, start_date, end_date, is_active, notes } = req.body;

    if (!product_id || !discount_type || discount_value === undefined) {
      return res.status(400).json({ error: 'product_id, discount_type, and discount_value are required' });
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

    const { data: product } = await supabase.from('products').select('id, price').eq('id', product_id).single();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (discount_type === 'fixed' && numericValue > Number(product.price || 0)) {
      return res.status(400).json({ error: 'fixed discount cannot exceed product price' });
    }

    const startIso = toIsoOrNull(start_date);
    const endIso = toIsoOrNull(end_date);

    if (start_date && !startIso) return res.status(400).json({ error: 'Invalid start_date format' });
    if (end_date && !endIso) return res.status(400).json({ error: 'Invalid end_date format' });
    if (startIso && endIso && new Date(startIso) > new Date(endIso)) {
      return res.status(400).json({ error: 'end_date must be after start_date' });
    }

    const { data: result, error } = await supabase.from('discounts').insert([{
      product_id, discount_type, discount_value: Math.round(numericValue),
      start_date: startIso, end_date: endIso, is_active: is_active === undefined ? 1 : (is_active ? 1 : 0),
      notes: notes || null
    }]).select().single();

    if (error) throw error;
    
    const created = await getDiscountById(result.id);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT update discount
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await getDiscountById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Discount not found' });

    const updates = {};
    if (req.body.product_id !== undefined) {
      const { data: product } = await supabase.from('products').select('id, price').eq('id', req.body.product_id).single();
      if (!product) return res.status(404).json({ error: 'Product not found' });
      updates.product_id = req.body.product_id;
    }

    const nextType = req.body.discount_type !== undefined ? req.body.discount_type : existing.discount_type;
    if (req.body.discount_type !== undefined) {
      if (!['percentage', 'fixed'].includes(req.body.discount_type)) {
        return res.status(400).json({ error: 'discount_type must be percentage or fixed' });
      }
      updates.discount_type = req.body.discount_type;
    }

    const nextValue = req.body.discount_value !== undefined ? Number(req.body.discount_value) : Number(existing.discount_value);
    if (req.body.discount_value !== undefined) {
      if (!Number.isFinite(nextValue) || nextValue <= 0) return res.status(400).json({ error: 'discount_value must be greater than 0' });
      updates.discount_value = Math.round(nextValue);
    }

    if (nextType === 'percentage' && nextValue > 100) {
      return res.status(400).json({ error: 'percentage discount cannot exceed 100' });
    }

    const productIdForValidation = req.body.product_id !== undefined ? req.body.product_id : existing.product_id;
    const { data: productForValidation } = await supabase.from('products').select('price').eq('id', productIdForValidation).single();
    
    if (nextType === 'fixed' && nextValue > Number(productForValidation?.price || 0)) {
      return res.status(400).json({ error: 'fixed discount cannot exceed product price' });
    }

    if (req.body.start_date !== undefined) {
      const startIso = toIsoOrNull(req.body.start_date);
      if (req.body.start_date && !startIso) return res.status(400).json({ error: 'Invalid start_date format' });
      updates.start_date = startIso;
    }

    if (req.body.end_date !== undefined) {
      const endIso = toIsoOrNull(req.body.end_date);
      if (req.body.end_date && !endIso) return res.status(400).json({ error: 'Invalid end_date format' });
      updates.end_date = endIso;
    }

    const startForCompare = req.body.start_date !== undefined ? toIsoOrNull(req.body.start_date) : existing.start_date;
    const endForCompare = req.body.end_date !== undefined ? toIsoOrNull(req.body.end_date) : existing.end_date;

    if (startForCompare && endForCompare && new Date(startForCompare) > new Date(endForCompare)) {
      return res.status(400).json({ error: 'end_date must be after start_date' });
    }

    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active ? 1 : 0;
    if (req.body.notes !== undefined) updates.notes = req.body.notes || null;
    
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 1) return res.status(400).json({ error: 'No fields to update' });

    const { error } = await supabase.from('discounts').update(updates).eq('id', req.params.id);
    if (error) throw error;

    const updated = await getDiscountById(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE discount
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: existing } = await supabase.from('discounts').select('id').eq('id', req.params.id).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Discount not found' });

    const { error } = await supabase.from('discounts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Discount deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
