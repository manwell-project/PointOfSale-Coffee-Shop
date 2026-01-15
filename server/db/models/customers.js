const db = require('../models/connection');

const add = async (name, phone, email) => {
  const res = await db.run('INSERT INTO customers(name,phone,email) VALUES (?,?,?)', [name, phone, email]);
  return { id: res.id, name, phone, email };
};

const all = async () => await db.all('SELECT * FROM customers ORDER BY created_at DESC');

const findById = async (id) => await db.get('SELECT * FROM customers WHERE id = ?', [id]);

module.exports = { add, all, findById };
