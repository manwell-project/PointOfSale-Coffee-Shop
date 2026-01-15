const path = require('path');
const { dbHelpers } = require('./connection');

async function inspectTx() {
  try {
    const sumRow = await dbHelpers.get('SELECT SUM(total_amount) as total_revenue, COUNT(*) as cnt FROM transactions');
    const txs = await dbHelpers.all('SELECT id, total_amount, transaction_date, created_at FROM transactions ORDER BY created_at DESC LIMIT 50');

    console.log('--- Transactions Inspect ---');
    console.log('total_transactions:', sumRow ? sumRow.cnt : 0);
    console.log('total_revenue (SUM total_amount):', sumRow ? sumRow.total_revenue : 0);
    console.log('recent transactions (up to 50):');
    console.table(txs);
    process.exit(0);
  } catch (err) {
    console.error('Inspect error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

inspectTx();
