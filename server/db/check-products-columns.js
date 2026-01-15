const db = require('./init');

db.all("PRAGMA table_info(products)", (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  console.log('products columns:', rows.map(r => r.name));
  process.exit(0);
});
