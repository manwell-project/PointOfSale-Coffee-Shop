const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'digicaf.db');

let db = null;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
      }
    });
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
      db = null;
    });
  }
}

// Helper functions for common operations
const dbHelpers = {
  // Run single query
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      getDatabase().run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },

  // Get single row
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      getDatabase().get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get all rows
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      getDatabase().all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  // Execute multiple queries in transaction
  transaction: async (queries) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            reject(err);
            return;
          }

          let completed = 0;
          const results = [];

          queries.forEach((query, index) => {
            db.run(query.sql, query.params || [], function(err) {
              if (err) {
                db.run('ROLLBACK', () => reject(err));
                return;
              }
              results[index] = { id: this.lastID, changes: this.changes };
              completed++;

              if (completed === queries.length) {
                db.run('COMMIT', (err) => {
                  if (err) reject(err);
                  else resolve(results);
                });
              }
            });
          });
        });
      });
    });
  }
};

module.exports = { getDatabase, closeDatabase, dbHelpers };
