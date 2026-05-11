const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'digicaf.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }

  // Get all employees
  db.all("SELECT id, name, position, shift, status, username FROM employees ORDER BY id DESC LIMIT 10", (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Recent employees:');
      rows.forEach(emp => {
        console.log(`  ${emp.id}: ${emp.name} (${emp.position}) - ${emp.username || 'no username'}`);
      });
    }
    
    db.close();
    process.exit(0);
  });
});
