const db = require('../models/connection');

// create a transaction and its items. items: [{product_id, quantity, unit_price}]
const create = async (customerId, employeeId, totalAmount, paymentMethod, items = []) => {
  // Build queries for transaction and items
  const queries = [];
  queries.push({ sql: 'INSERT INTO transactions (customer_id, employee_id, total_amount, payment_method) VALUES (?,?,?,?)', params: [customerId || null, employeeId || null, totalAmount, paymentMethod || null] });

  // We'll run the transaction insert first
  const results = await db.transaction(queries);
  const trxInsertResult = results[0];
  const trxId = trxInsertResult.id;

  // Insert items
  for (const it of items) {
    await db.run('INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)', [trxId, it.product_id, it.quantity, it.unit_price, it.quantity * it.unit_price]);
  }

  return trxId;
};

const all = async () => await db.all('SELECT * FROM transactions ORDER BY transaction_date DESC');

module.exports = { create, all };
