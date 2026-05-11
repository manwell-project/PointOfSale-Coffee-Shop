const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'digicaf.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }

  // Get detailed info on the most recent employee
  db.get("SELECT * FROM employees ORDER BY id DESC LIMIT 1", (err, emp) => {
    if (err) {
      console.error('Error:', err.message);
    } else if (emp) {
      console.log('Most recent employee:');
      console.log(JSON.stringify(emp, null, 2));
    } else {
      console.log('No employees found');
    }
    
    db.close();
    process.exit(0);
  });
});
