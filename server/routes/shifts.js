const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');

// Get active (open) shifts
router.get('/active', async (req, res, next) => {
  try {
    const shifts = await dbHelpers.all(`SELECT s.*, e.name as employee_name FROM shifts s JOIN employees e ON s.employee_id = e.id WHERE s.status = 'open' ORDER BY s.start_time DESC`);
    res.json(shifts);
  } catch (err) { next(err); }
});

// Open a new shift
router.post('/open', async (req, res, next) => {
  try {
    const { employee_id, starting_cash } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'employee_id required' });

    const result = await dbHelpers.run(
      'INSERT INTO shifts (employee_id, starting_cash, status) VALUES (?, ?, ?)',
      [employee_id, Number(starting_cash || 0), 'open']
    );

    const shiftId = result.id;
    const shift = await dbHelpers.get('SELECT * FROM shifts WHERE id = ?', [shiftId]);
    res.status(201).json(shift);
  } catch (err) { next(err); }
});

// Close a shift
router.post('/close', async (req, res, next) => {
  try {
    const { shift_id, actual_ending_cash, notes } = req.body;
    if (!shift_id) return res.status(400).json({ error: 'shift_id required' });

    // Get shift
    const shift = await dbHelpers.get('SELECT * FROM shifts WHERE id = ?', [shift_id]);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    // Compute expected ending cash: starting_cash + cash sales during shift
    const cashSumRow = await dbHelpers.get(
      `SELECT IFNULL(SUM(total_amount),0) as cash_total FROM transactions WHERE employee_id = ? AND payment_method = 'cash' AND datetime(created_at) >= datetime(?) AND datetime(created_at) <= datetime('now')`,
      [shift.employee_id, shift.start_time]
    );
    const cashTotal = Number(cashSumRow && cashSumRow.cash_total ? cashSumRow.cash_total : 0);
    const expected_ending_cash = Number(shift.starting_cash || 0) + cashTotal;

    // Update shift
    await dbHelpers.run(
      'UPDATE shifts SET end_time = CURRENT_TIMESTAMP, expected_ending_cash = ?, actual_ending_cash = ?, status = ?, notes = ? WHERE id = ?',
      [expected_ending_cash, Number(actual_ending_cash || 0), 'closed', notes || null, shift_id]
    );

    const updated = await dbHelpers.get('SELECT * FROM shifts WHERE id = ?', [shift_id]);
    res.json({ shift: updated, expected_ending_cash });
  } catch (err) { next(err); }
});

// List shifts (recent)
router.get('/', async (req, res, next) => {
  try {
    const shifts = await dbHelpers.all(`SELECT s.*, e.name as employee_name FROM shifts s JOIN employees e ON s.employee_id = e.id ORDER BY s.start_time DESC LIMIT 200`);
    res.json(shifts);
  } catch (err) { next(err); }
});

module.exports = router;
