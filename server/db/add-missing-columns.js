const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'digicaf.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  
  const columnsToAdd = [
    { column: 'username', type: 'VARCHAR(100)' },
    { column: 'password_hash', type: 'VARCHAR(255)' },
    { column: 'role', type: 'VARCHAR(50)' }
  ];

  let completed = 0;

  columnsToAdd.forEach(({ column, type }) => {
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
        
        // Verify all columns exist now
        db.all("PRAGMA table_info(employees)", (err, rows) => {
          if (err) {
            console.error('Error:', err.message);
          } else {
            console.log('\nFinal employees table columns:');
            rows.forEach(col => {
              console.log(`  ${col.name} (${col.type})`);
            });
          }
          
          db.close();
          process.exit(0);
        });
      }
    });
  });
});
