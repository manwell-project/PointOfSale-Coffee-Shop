const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'digicaf.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting migration: move products with is_menu=0 to raw_materials/raw_stocks');

db.serialize(() => {
  db.all(
    'SELECT p.id, p.name, p.category, p.price, p.description, p.is_available, s.quantity, s.min_stock FROM products p LEFT JOIN stocks s ON p.id = s.product_id WHERE p.is_menu = 0',
    (err, rows) => {
      if (err) {
        console.error('Error selecting raw-like products:', err.message);
        process.exit(1);
      }

      if (!rows || rows.length === 0) {
        console.log('No products with is_menu=0 found. Nothing to migrate.');
        process.exit(0);
      }

      let index = 0;
      const next = () => {
        if (index >= rows.length) {
          console.log('Migration complete. Migrated', index, 'items.');
          process.exit(0);
        }
        const r = rows[index++];

        db.run(
          'INSERT INTO raw_materials (name, category, price, description, is_available) VALUES (?, ?, ?, ?, ?)',
          [r.name, r.category, r.price || 0, r.description || '', r.is_available || 1],
          function (err) {
            if (err) {
              console.error('Insert raw_materials failed for product', r.id, err.message);
              return next();
            }

            const rawId = this.lastID;
            const qty = r.quantity != null ? r.quantity : 0;
            const min = r.min_stock != null ? r.min_stock : 5;

            db.run('INSERT INTO raw_stocks (raw_material_id, quantity, min_stock) VALUES (?, ?, ?)', [rawId, qty, min], (err) => {
              if (err) {
                console.error('Insert raw_stocks failed for raw_material', rawId, err.message);
                return next();
              }

              db.run('DELETE FROM stock_history WHERE product_id = ?', [r.id], (err) => {
                if (err) console.warn('Could not delete old stock_history for product', r.id, err.message);

                db.run('DELETE FROM stocks WHERE product_id = ?', [r.id], (err) => {
                  if (err) console.warn('Could not delete old stocks for product', r.id, err.message);

                  db.run('DELETE FROM products WHERE id = ?', [r.id], (err) => {
                    if (err) console.error('Could not delete product', r.id, err.message);
                    else console.log('Migrated product', r.id, '-> raw_materials id', rawId);
                    next();
                  });
                });
              });
            });
          }
        );
      };

      next();
    }
  );
});
const dbPath = require('path').join(__dirname, 'digicaf.db');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

console.log('Starting migration: move products with is_menu=0 to raw_materials/raw_stocks');

db.serialize(() => {
  db.all('SELECT p.*, s.quantity, s.min_stock FROM products p LEFT JOIN stocks s ON p.id = s.product_id WHERE p.is_menu = 0', (err, rows) => {
    if (err) {
      console.error('Error selecting raw-like products:', err.message);
      process.exit(1);
    }

    if (!rows || rows.length === 0) {
      console.log('No products with is_menu=0 found. Nothing to migrate.');
      process.exit(0);
    }

    let migrated = 0;
    rows.forEach((r) => {
      db.run('BEGIN TRANSACTION');
      db.run('INSERT INTO raw_materials (name, category, price, description, is_available) VALUES (?, ?, ?, ?, ?)',
        [r.name, r.category, r.price || 0, r.description || '', r.is_available || 1], function(err) {
          if (err) {
            console.error('Insert raw_materials failed for', r.id, err.message);
            db.run('ROLLBACK');
            return;
          }

          const rawId = this.lastID;
          const qty = (r.quantity !== undefined && r.quantity !== null) ? r.quantity : 0;
          const min = (r.min_stock !== undefined && r.min_stock !== null) ? r.min_stock : 5;

          db.run('INSERT INTO raw_stocks (raw_material_id, quantity, min_stock) VALUES (?, ?, ?)', [rawId, qty, min], (err) => {
            if (err) {
              console.error('Insert raw_stocks failed for', rawId, err.message);
              db.run('ROLLBACK');
              return;
            }

            // Delete old stock_history entries for this product if any
            db.run('DELETE FROM stock_history WHERE product_id = ?', [r.id], (err) => {
              if (err) console.warn('Could not delete old stock_history for product', r.id, err.message);

              // Delete old stocks row
              db.run('DELETE FROM stocks WHERE product_id = ?', [r.id], (err) => {
                if (err) console.warn('Could not delete old stocks for product', r.id, err.message);

                // Finally delete product row
                db.run('DELETE FROM products WHERE id = ?', [r.id], (err) => {
                  if (err) {
                    console.error('Could not delete product', r.id, err.message);
                    db.run('ROLLBACK');
                    return;
                  }

                  db.run('COMMIT');
                  migrated++;
                  console.log('Migrated product', r.id, '-> raw_materials id', rawId);
                  if (migrated === rows.length) {
                    console.log('Migration complete. Migrated', migrated, 'items.');
                    process.exit(0);
                  }
                });
              });
            });
          });
        }
      );
    });
  });
});
