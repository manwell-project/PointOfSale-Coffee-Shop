const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, 'digicaf.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error('DB open error', err.message);
});

function q(sql) { return new Promise((res, rej) => db.all(sql, (err, rows) => err ? rej(err) : res(rows))); }

(async () => {
  try {
    console.log('--- CUSTOMERS ---');
    const customers = await q('SELECT * FROM customers');
    console.table(customers);

    console.log('\n--- TRANSACTIONS ---');
    const trans = await q('SELECT * FROM transactions');
    console.table(trans);

    console.log('\n--- TRANSACTION_ITEMS ---');
    const items = await q('SELECT * FROM transaction_items');
    console.table(items);

    console.log('\n--- AGGREGATE PER CUSTOMER (raw query) ---');
    const agg = await q(`SELECT c.id, c.name, COUNT(t.id) AS cnt, SUM(t.total_amount) AS sum_total, MAX(t.created_at) AS last_tx
      FROM customers c LEFT JOIN transactions t ON t.customer_id = c.id
      GROUP BY c.id`);
    console.table(agg);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    db.close();
  }
})();
