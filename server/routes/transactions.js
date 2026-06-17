const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// Formatter function to format date as YYYY-MM-DD
function toYYYYMMDD(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString().split('T')[0];
}

// GET all transactions
router.get('/', async (req, res, next) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (name),
        employees (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = transactions.map(t => {
      const c = Array.isArray(t.customers) ? t.customers[0] : t.customers;
      const e = Array.isArray(t.employees) ? t.employees[0] : t.employees;
      return {
        ...t,
        customer_name: c ? c.name : null,
        employee_name: e ? e.name : null,
        customers: undefined,
        employees: undefined
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET single transaction with items
router.get('/:id', async (req, res, next) => {
  try {
    const { data: transaction, error: tErr } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (name),
        employees (name)
      `)
      .eq('id', req.params.id)
      .single();

    if (tErr) {
      if (tErr.code === 'PGRST116') return res.status(404).json({ error: 'Transaction not found' });
      throw tErr;
    }

    const { data: items, error: iErr } = await supabase
      .from('transaction_items')
      .select(`
        *,
        products (name, category)
      `)
      .eq('transaction_id', req.params.id);

    if (iErr) throw iErr;

    const c = Array.isArray(transaction.customers) ? transaction.customers[0] : transaction.customers;
    const e = Array.isArray(transaction.employees) ? transaction.employees[0] : transaction.employees;

    const formattedItems = items.map(i => {
      const p = Array.isArray(i.products) ? i.products[0] : i.products;
      return {
        ...i,
        product_name: p ? p.name : null,
        category: p ? p.category : null,
        products: undefined
      };
    });

    res.json({
      ...transaction,
      customer_name: c ? c.name : null,
      employee_name: e ? e.name : null,
      customers: undefined,
      employees: undefined,
      items: formattedItems
    });
  } catch (err) {
    next(err);
  }
});

// POST create new transaction
router.post('/', async (req, res, next) => {
  try {
    const { items, customer_id, employee_id, payment_method, total_amount } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Transaction must have at least one item' });
    }

    // Compute totals on server
    const normalizedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const unit_price = Number(item.unit_price);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Invalid item quantity');
      if (!Number.isFinite(unit_price) || unit_price < 0) throw new Error('Invalid item unit_price');
      return {
        product_id: item.product_id,
        quantity,
        unit_price,
        subtotal: quantity * unit_price
      };
    });

    const computedTotalAmount = normalizedItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const finalTotalAmount = computedTotalAmount;

    // Create transaction
    const { data: result, error: tErr } = await supabase
      .from('transactions')
      .insert([{
        customer_id: customer_id || null,
        employee_id: employee_id || null,
        total_amount: finalTotalAmount,
        payment_method: payment_method || 'cash',
        status: 'completed'
      }])
      .select()
      .single();

    if (tErr) throw tErr;
    const transactionId = result.id;

    // Prepare transaction items
    const tiRecords = normalizedItems.map(item => ({
      transaction_id: transactionId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal
    }));

    const { error: tiErr } = await supabase.from('transaction_items').insert(tiRecords);
    if (tiErr) throw tiErr;

    // Fetch existing stocks for the products involved
    const productIds = normalizedItems.map(i => i.product_id);
    const { data: existingStocks } = await supabase
      .from('stocks')
      .select('*')
      .in('product_id', productIds);

    const stockMap = {};
    if (existingStocks) {
      existingStocks.forEach(s => { stockMap[s.product_id] = s; });
    }

    const shRecords = [];

    // Reduce stock and prepare history
    for (const item of normalizedItems) {
      const stock = stockMap[item.product_id];
      if (stock) {
        const newQuantity = stock.quantity - item.quantity;
        await supabase
          .from('stocks')
          .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
          .eq('product_id', item.product_id);

        shRecords.push({
          product_id: item.product_id,
          quantity_before: stock.quantity,
          quantity_after: newQuantity,
          change_reason: 'Sold in transaction #' + transactionId,
          changed_by_employee_id: employee_id || null
        });
      }
    }

    // Insert stock history
    if (shRecords.length > 0) {
      await supabase.from('stock_history').insert(shRecords);
    }

    // Update customer stats
    if (customer_id) {
      try {
        const { data: cust } = await supabase.from('customers').select('total_transactions, total_spent').eq('id', customer_id).single();
        if (cust) {
          await supabase
            .from('customers')
            .update({
              total_transactions: (cust.total_transactions || 0) + 1,
              total_spent: (cust.total_spent || 0) + finalTotalAmount
            })
            .eq('id', customer_id);
        }
      } catch (err) {
        console.warn('Customer stats update skipped or failed:', err.message || err);
      }
    }

    res.status(201).json({ 
      id: transactionId, 
      customer_id, 
      employee_id,
      total_amount: finalTotalAmount,
      payment_method: payment_method || 'cash',
      status: 'completed',
      items: normalizedItems
    });
  } catch (err) {
    next(err);
  }
});

// GET transactions for a specific date
router.get('/date/:date', async (req, res, next) => {
  try {
    const dateStr = req.params.date; // YYYY-MM-DD
    const nextDateObj = new Date(dateStr);
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDateStr = nextDateObj.toISOString().split('T')[0];

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (name),
        employees (name)
      `)
      .gte('created_at', dateStr)
      .lt('created_at', nextDateStr)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = transactions.map(t => {
      const c = Array.isArray(t.customers) ? t.customers[0] : t.customers;
      const e = Array.isArray(t.employees) ? t.employees[0] : t.employees;
      return {
        ...t,
        customer_name: c ? c.name : null,
        employee_name: e ? e.name : null,
        customers: undefined,
        employees: undefined
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET daily sales summary
router.get('/summary/daily', async (req, res, next) => {
  try {
    // In Supabase, grouping is usually done via RPC. Since we don't have an RPC, 
    // we fetch recent transactions and group them in memory.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('created_at, total_amount')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    const map = {};
    for (const t of transactions) {
      const date = toYYYYMMDD(t.created_at);
      if (!map[date]) {
        map[date] = { date, transaction_count: 0, total_sales: 0 };
      }
      map[date].transaction_count += 1;
      map[date].total_sales += Number(t.total_amount || 0);
    }

    const summary = Object.values(map).sort((a, b) => b.date.localeCompare(a.date));

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// ======================= KDS ROUTES =======================

// GET active KDS orders (Today's orders not completed in KDS)
router.get('/kds/active', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // We try to query using kds_status. If column doesn't exist, we fallback safely.
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (name),
        transaction_items (
          quantity,
          products (name)
        )
      `)
      .gte('created_at', today)
      .order('created_at', { ascending: true });

    if (error) {
      // If error is about kds_status not existing, just return empty to not break app
      console.warn('KDS query error:', error.message);
      return res.json([]);
    }

    // Format the items nicely
    const formatted = transactions
      .filter(t => t.kds_status !== 'completed' && t.kds_status !== 'Selesai')
      .map(t => {
        const c = Array.isArray(t.customers) ? t.customers[0] : t.customers;
        const items = (t.transaction_items || []).map(i => {
          const p = Array.isArray(i.products) ? i.products[0] : i.products;
          return {
            quantity: i.quantity,
            product_name: p ? p.name : 'Unknown'
          };
        });
        
        return {
          id: t.id,
          transaction_no: t.id,
          time: t.created_at,
          status: t.kds_status || 'pending',
          customer: c ? c.name : 'Walk-in',
          items: items
        };
      });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// PUT update KDS status
router.put('/kds/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const { error } = await supabase
      .from('transactions')
      .update({ kds_status: status })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
