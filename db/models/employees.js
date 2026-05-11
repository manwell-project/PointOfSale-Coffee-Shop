const db = require('./connection');
const crypto = require('crypto');

const add = async (name, shift, phone, email) => {
  const res = await db.run('INSERT INTO employees(name,shift,phone,email) VALUES (?,?,?,?)', [name, shift, phone, email]);
  return { id: res.id, name, shift, phone, email };
};

const addWithCredentials = async (name, username, email, password, role = 'Karyawan') => {
  const password_hash = crypto.createHash('sha256').update(String(password)).digest('hex');
  const res = await db.run(
    'INSERT INTO employees(name,username,email,password_hash,role) VALUES (?,?,?,?,?)',
    [name, username, email, password_hash, role]
  );
  return { id: res.id, name, username, email, role };
};

const all = async () => await db.all('SELECT * FROM employees ORDER BY name');

const remove = async (id) => await db.run('DELETE FROM employees WHERE id = ?', [id]);

module.exports = { add, addWithCredentials, all, remove };
