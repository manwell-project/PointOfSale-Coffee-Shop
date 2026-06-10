ALTER TABLE products ADD COLUMN IF NOT EXISTS is_menu INTEGER DEFAULT 1;
ALTER TABLE employees RENAME COLUMN joindate TO "joinDate";

-- Segarkan cache schema Supabase
NOTIFY pgrst, 'reload schema';
