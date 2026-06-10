const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const crypto = require('crypto');

function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Identifier and password required' });

    const id = String(identifier).trim();

    let { data: employee } = await supabase.from('employees').select('*').ilike('username', id).maybeSingle();
    
    if (!employee) {
      const { data: empByEmail } = await supabase.from('employees').select('*').ilike('email', id).maybeSingle();
      employee = empByEmail;
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
