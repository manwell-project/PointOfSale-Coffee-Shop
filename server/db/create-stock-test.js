const { dbHelpers } = require('./connection');

async function run() {
  try {
    const name = 'Test Bahan Baku X';
    const category = 'Raw Material';
    const price = 0;
    const description = 'Test raw material';
    const quantity = 20;
    const min_stock = 5;

    // Insert product
    const prodRes = await dbHelpers.run('INSERT INTO products (name, category, price, description, is_menu) VALUES (?, ?, ?, ?, ?)', [name, category, price, description, 0]);
    const productId = prodRes.id;

    // Insert stock
    const stockRes = await dbHelpers.run('INSERT INTO stocks (product_id, quantity, min_stock) VALUES (?, ?, ?)', [productId, quantity, min_stock]);

    const row = await dbHelpers.get('SELECT s.*, p.name, p.is_menu FROM stocks s JOIN products p ON s.product_id = p.id WHERE s.id = ?', [stockRes.id]);
    console.log('Created stock:', row);
    process.exit(0);
  } catch (err) {
    console.error('Error creating stock test:', err.message || err);
    process.exit(1);
  }
}

run();
