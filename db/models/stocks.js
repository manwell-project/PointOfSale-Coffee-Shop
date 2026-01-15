const db = require('./connection');

const add = async (productId, quantity = 0, minStock = 5) => {
  const res = await db.run('INSERT OR REPLACE INTO stocks(product_id, quantity, min_stock) VALUES (?,?,?)', [productId, quantity, minStock]);
  return { id: res.id, productId, quantity, minStock };
};

const all = async () => await db.all('SELECT * FROM stocks ORDER BY product_id');

const findByProductId = async (productId) => await db.get('SELECT * FROM stocks WHERE product_id = ?', [productId]);

module.exports = { add, all, findByProductId };
