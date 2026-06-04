const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'digicaf.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
  checkAndAddBarcodeColumn();
});

function checkAndAddBarcodeColumn() {
  db.all("PRAGMA table_info(products)", (err, rows) => {
    if (err) {
      console.error('Error getting table info:', err.message);
      db.close();
      return;
    }

    const hasBarcode = (rows || []).some(r => r.name === 'barcode');
    
    if (hasBarcode) {
      console.log('✅ Barcode column already exists');
      db.close();
      return;
    }

    console.log('Adding barcode column...');
    db.run('ALTER TABLE products ADD COLUMN barcode VARCHAR(50)', (err) => {
      if (err) {
        console.error('Error adding barcode column:', err.message);
      } else {
        console.log('✅ Barcode column added successfully');

        // Create index for faster barcode lookup
        db.run('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)', (err) => {
          if (err) {
            console.error('Error creating barcode index:', err.message);
          } else {
            console.log('✅ Barcode index created successfully');
          }
          db.close();
        });
      }
    });
  });
}
