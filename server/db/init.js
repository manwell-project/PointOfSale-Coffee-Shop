const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'digicaf.db');

// Create or open database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Read schema file
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split by semicolon and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim());

  db.serialize(() => {
    let executed = 0;
    statements.forEach((statement, index) => {
      db.run(statement.trim() + ';', (err) => {
        if (err) {
          console.error(`Error executing statement ${index + 1}:`, err.message);
        } else {
          executed++;
          if (executed === statements.length) {
            console.log('✅ Database schema initialized successfully');
            seedInitialData();
          }
        }
      });
    });
  });
}

function seedInitialData() {
  // Check if data already exists
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) {
      console.error('Error checking existing data:', err.message);
      return;
    }

    if (row.count > 0) {
      console.log('✅ Database already has data, skipping seed');
      // Do not close DB here so migration/alter steps can run afterwards
      return;
    }

    console.log('📝 Seeding initial data...');

    // Insert sample products dengan stok yang bervariasi untuk testing
    const products = [
      { name: 'Espresso', category: 'Coffee', price: 20000, description: 'Kopi espresso murni', qty: 0, min: 5 },
      { name: 'Cappuccino', category: 'Coffee', price: 25000, description: 'Espresso dengan susu', qty: 2, min: 5 },
      { name: 'Latte', category: 'Coffee', price: 23000, description: 'Kopi dengan susu hangat', qty: 8, min: 5 },
      { name: 'Americano', category: 'Coffee', price: 18000, description: 'Espresso dengan air panas', qty: 45, min: 5 },
      { name: 'Mocha', category: 'Coffee', price: 27000, description: 'Cappuccino dengan coklat', qty: 4, min: 8 },
      { name: 'Affogato', category: 'Coffee', price: 30000, description: 'Es krim dengan espresso', qty: 50, min: 10 },
      { name: 'Iced Coffee', category: 'Coffee', price: 22000, description: 'Kopi dingin', qty: 35, min: 8 },
      { name: 'Matcha Latte', category: 'Tea', price: 28000, description: 'Teh matcha dengan susu', qty: 3, min: 6 },
      { name: 'Thai Tea', category: 'Tea', price: 21000, description: 'Teh Thai original', qty: 28, min: 10 },
      { name: 'Croissant', category: 'Pastry', price: 15000, description: 'Roti croissant butter', qty: 12, min: 15 }
    ];

    db.serialize(() => {
      let productsInserted = 0;
      products.forEach((product) => {
        db.run(
          'INSERT INTO products (name, category, price, description) VALUES (?, ?, ?, ?)',
          [product.name, product.category, product.price, product.description],
          function(err) {
            if (err) {
              console.error('Error inserting product:', err.message);
            } else {
              // Insert stock for this product dengan qty yang bervariasi
              db.run(
                'INSERT INTO stocks (product_id, quantity, min_stock) VALUES (?, ?, ?)',
                [this.lastID, product.qty, product.min],
                (err) => {
                  if (err) console.error('Error inserting stock:', err.message);
                }
              );
              productsInserted++;
              if (productsInserted === products.length) {
                seedEmployees();
              }
            }
          }
        );
      });
    });
  });
}

function seedEmployees() {
  const adminHash = crypto.createHash('sha256').update('123456').digest('hex');
  const kasirHash = crypto.createHash('sha256').update('123456').digest('hex');
  
  const employees = [
    { name: 'Admin User', username: 'admin', email: 'admin@gmail.com', password_hash: adminHash, role: 'Admin', shift: 'Full Time', phone: '08123456700' },
    { name: 'Kasir User', username: 'kasir', email: 'kasir@gmail.com', password_hash: kasirHash, role: 'Kasir', shift: 'Full Time', phone: '08123456701' },
    { name: 'Budi Santoso', shift: 'Pagi', phone: '08123456789', email: 'budi@coffee.com', username: null, password_hash: null, role: 'Karyawan' },
    { name: 'Sari Dewi', shift: 'Siang', phone: '08123456790', email: 'sari@coffee.com', username: null, password_hash: null, role: 'Karyawan' },
    { name: 'Ahmad Fauzi', shift: 'Full Time', phone: '08123456791', email: 'ahmad@coffee.com', username: null, password_hash: null, role: 'Karyawan' }
  ];

  let employeesInserted = 0;
  employees.forEach((emp) => {
    db.run(
      'INSERT INTO employees (name, username, email, password_hash, role, shift, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [emp.name, emp.username, emp.email, emp.password_hash, emp.role, emp.shift, emp.phone],
      (err) => {
        if (err) {
          console.error('Error inserting employee:', err.message);
        } else {
          employeesInserted++;
          if (employeesInserted === employees.length) {
            console.log('✅ Initial data seeded successfully');
            console.log('💾 Database ready at: server/db/digicaf.db');
            // Don't close db here - let the server keep it open
          }
        }
      }
    );
  });
}

module.exports = db;

// Ensure required columns exist in products table
try {
  db.serialize(() => {
    db.get("PRAGMA table_info(products)", (err) => {
      // query table info list and check column presence
    });

    db.all("PRAGMA table_info(products)", (err, rows) => {
      if (err) return;
      const hasIsMenu = (rows || []).some(r => r.name === 'is_menu');
      const hasBarcode = (rows || []).some(r => r.name === 'barcode');
      
      if (!hasIsMenu) {
        db.run('ALTER TABLE products ADD COLUMN is_menu INTEGER DEFAULT 1', (err) => {
          if (err) console.error('Error adding is_menu column:', err.message);
          else console.log('✅ products.is_menu column added');
        });
      }
      
      if (!hasBarcode) {
        // Add barcode column without UNIQUE constraint first (will be handled in migration)
        db.run('ALTER TABLE products ADD COLUMN barcode VARCHAR(50)', (err) => {
          if (err) {
            // If it fails with UNIQUE error, try without constraint
            if (err.message.includes('UNIQUE')) {
              console.warn('⚠️ Cannot add UNIQUE barcode column to existing table with data. Skipping...');
              console.warn('    Please run migration: 009_add_barcode_to_products.sql manually');
            } else {
              console.error('Error adding barcode column:', err.message);
            }
          } else {
            console.log('✅ products.barcode column added');
            // Create index for faster barcode lookup
            db.run('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)', (err) => {
              if (err) console.error('Error creating barcode index:', err.message);
              else console.log('✅ Barcode index created');
            });
          }
        });
      }
    });
  });
} catch (e) {
  console.warn('Could not ensure products columns:', e && e.message ? e.message : e);
}
