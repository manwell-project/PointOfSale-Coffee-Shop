-- 007_add_credentials_to_employees.sql
-- Menambahkan kolom untuk menyimpan kredensial (username + password hash) dan role
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

ALTER TABLE employees ADD COLUMN username TEXT;
ALTER TABLE employees ADD COLUMN password_hash TEXT;
ALTER TABLE employees ADD COLUMN role TEXT;

COMMIT;
PRAGMA foreign_keys=ON;

-- Note: Applies to SQLite. Username uniqueness should be enforced at application level.