const db = require('./connection');

const create = async (name, category, price, description = null, imageUrl = null, isAvailable = 1) => {
  const res = await db.run('INSERT INTO products(name,category,price,description,image_url,is_available) VALUES (?,?,?,?,?,?)', [name, category, price, description, imageUrl, isAvailable]);
  return { id: res.id, name, category, price, description, imageUrl, isAvailable };
};

const all = async () => await db.all('SELECT * FROM products ORDER BY name');

const findById = async (id) => await db.get('SELECT * FROM products WHERE id = ?', [id]);

module.exports = { create, all, findById };
