const db = require('./connection');

const add = async (name, shift, phone, email) => {
  const res = await db.run('INSERT INTO employees(name,shift,phone,email) VALUES (?,?,?,?)', [name, shift, phone, email]);
  return { id: res.id, name, shift, phone, email };
};

const all = async () => await db.all('SELECT * FROM employees ORDER BY name');

const remove = async (id) => await db.run('DELETE FROM employees WHERE id = ?', [id]);

module.exports = { add, all, remove };
