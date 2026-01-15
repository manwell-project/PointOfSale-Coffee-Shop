const { dbHelpers } = require('./connection');

async function inspect() {
  try {
    const counts = {};
    counts.products = (await dbHelpers.all('SELECT id FROM products')).length;
    counts.stocks = (await dbHelpers.all('SELECT id FROM stocks')).length;
    counts.employees = (await dbHelpers.all('SELECT id FROM employees')).length;
    counts.customers = (await dbHelpers.all('SELECT id FROM customers')).length;
    const txs = await dbHelpers.all('SELECT id, total_amount, paid_amount, created_at, transaction_no FROM transactions ORDER BY created_at DESC LIMIT 20');
    const txCount = (await dbHelpers.all('SELECT id FROM transactions')).length;
    const sumRow = await dbHelpers.get('SELECT SUM(total_amount) as total_revenue, COUNT(*) as cnt FROM transactions');

    console.log('--- Database Inspect ---');
    console.log('counts:', counts);
    console.log('transactions count:', txCount);
    console.log('transactions sum total_amount:', sumRow ? sumRow.total_revenue : null);
    console.log('recent transactions (up to 20):');
    console.table(txs);

    process.exit(0);
  } catch (err) {
    console.error('Inspect error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

inspect();
