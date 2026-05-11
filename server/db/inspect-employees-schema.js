const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'digicaf.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }

  // Get table structure
  db.all("PRAGMA table_info(employees)", (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Employees table columns:');
      rows.forEach(col => {
        console.log(`  ${col.name} (${col.type})`);
      });
    }
    
    db.close();
    process.exit(0);
  });
});
