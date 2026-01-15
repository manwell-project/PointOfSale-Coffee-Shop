-- 006_create_customers.sql
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT DEFAULT 'regular', -- 'regular' | 'vip'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
