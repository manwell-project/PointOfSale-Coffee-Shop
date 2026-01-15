const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_DIR = path.join(__dirname);
// Use the server DB so both server and app share the same database file
const DB_FILE = path.join(__dirname, '..', 'server', 'db', 'digicaf.db');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function run() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error('Migrations directory not found:', MIGRATIONS_DIR);
    process.exit(1);
  }

  const db = new Database(DB_FILE);
  db.pragma('foreign_keys = ON');

  // Ensure _migrations table exists
  db.prepare(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();

  // Read migration files sorted by name
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

  files.forEach(file => {
    const already = db.prepare('SELECT name FROM _migrations WHERE name = ?').get(file);
    if (already) {
      console.log('Skipping already applied migration:', file);
      return;
    }
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
      console.log('Applying migration:', file);
      db.exec(sql);
      db.prepare('INSERT INTO _migrations(name) VALUES(?)').run(file);
    } catch (err) {
      console.error('Failed to apply migration', file, err.message);
      db.close();
      process.exit(1);
    }
  });

  console.log('Migrations applied successfully. DB file at:', DB_FILE);
  db.close();
}

if (require.main === module) run();

module.exports = { run };
