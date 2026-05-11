const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/connection');
const crypto = require('crypto');

function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

// POST /auth/login
// body: { identifier: 'email or username', password }
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Identifier and password required' });

    const id = String(identifier).trim();

    // Try username first, then email
    let employee = await dbHelpers.get('SELECT * FROM employees WHERE username = ? COLLATE NOCASE', [id]);
    if (!employee) {
      employee = await dbHelpers.get('SELECT * FROM employees WHERE email = ? COLLATE NOCASE', [id]);
    }

    if (!employee) {
      return res.status(401).json({ error: 'Kredensial tidak ditemukan' });
    }

    if (!employee.password_hash) {
      return res.status(401).json({ error: 'Akun tidak memiliki password terdaftar' });
    }

    const password_hash = hashPassword(password);
    if (password_hash !== employee.password_hash) {
      return res.status(401).json({ error: 'Password salah' });
    }

    // Successful
    const session = {
      id: employee.id,
      userName: employee.username || employee.name,
      role: employee.role || 'Karyawan',
      email: employee.email || null,
      loginAt: new Date().toISOString()
    };
    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
