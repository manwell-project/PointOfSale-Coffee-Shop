const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'digicaf.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  
  const columnsToAdd = [
    { column: 'position', type: 'TEXT' },
    { column: 'address', type: 'TEXT' },
    { column: 'joinDate', type: 'TEXT' },
    { column: 'notes', type: 'TEXT' }
  ];

  let completed = 0;

  columnsToAdd.forEach(({ column, type }) => {
    db.run(`PRAGMA table_info(employees)`, (err, result) => {
      if (err) {
        console.error(`Error checking table info:`, err.message);
        return;
      }
    });

    // Try to add column - will fail silently if it already exists
    db.run(`ALTER TABLE employees ADD COLUMN ${column} ${type}`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Error adding ${column}:`, err.message);
      } else if (!err) {
        console.log(`✅ Added column: ${column}`);
      } else {
        console.log(`Column ${column} already exists`);
      }
      
      completed++;
      if (completed === columnsToAdd.length) {
        console.log('Migration complete!');
        db.close();
        process.exit(0);
      }
    });
  });
});
