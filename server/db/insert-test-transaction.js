const { dbHelpers } = require('./connection');

async function run() {
  try {
    const items = [ { product_id: 4, quantity: 1, unit_price: 18000, subtotal: 18000 } ];
    const customer_id = null;
    const employee_id = 1;
    const payment_method = 'cash';
    const total_amount = 18000;

    const result = await dbHelpers.run(
      'INSERT INTO transactions (customer_id, employee_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
      [customer_id, employee_id, total_amount, payment_method, 'completed']
    );

    const transactionId = result.id;

    for (const item of items) {
      await dbHelpers.run(
        'INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [transactionId, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );

      const stock = await dbHelpers.get('SELECT * FROM stocks WHERE product_id = ?', [item.product_id]);
      if (stock) {
        const newQuantity = stock.quantity - item.quantity;
        await dbHelpers.run('UPDATE stocks SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?', [newQuantity, item.product_id]);
        await dbHelpers.run('INSERT INTO stock_history (product_id, quantity_before, quantity_after, change_reason, changed_by_employee_id) VALUES (?, ?, ?, ?, ?)', [item.product_id, stock.quantity, newQuantity, 'Sold in test transaction #' + transactionId, employee_id]);
      }
    }

    if (customer_id) {
      await dbHelpers.run('UPDATE customers SET total_transactions = total_transactions + 1, total_spent = total_spent + ? WHERE id = ?', [total_amount, customer_id]);
    }

    console.log('Inserted test transaction id=', transactionId);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting test transaction:', err.message || err);
    process.exit(1);
  }
}

run();
