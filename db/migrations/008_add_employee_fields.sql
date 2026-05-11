-- 008_add_employee_fields.sql
-- Menambahkan kolom tambahan untuk employee management
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

ALTER TABLE employees ADD COLUMN position TEXT;
ALTER TABLE employees ADD COLUMN address TEXT;
ALTER TABLE employees ADD COLUMN joinDate TEXT;
ALTER TABLE employees ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE employees ADD COLUMN notes TEXT;
ALTER TABLE employees ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

COMMIT;
PRAGMA foreign_keys=ON;
