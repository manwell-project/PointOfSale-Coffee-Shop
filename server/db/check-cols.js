const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/db/digicaf.db');
const tables = ['products', 'employees', 'customers', 'raw_materials', 'stocks', 'discounts', 'raw_stocks', 'transactions', 'stock_history', 'raw_stock_history', 'transaction_items'];
let pending = tables.length;
tables.forEach(t => {
  db.all(`PRAGMA table_info(${t})`, (err, rows) => {
    if (rows) console.log(t, ':', rows.map(r => r.name).join(', '));
    pending--;
    if (pending === 0) db.close();
  });
});
