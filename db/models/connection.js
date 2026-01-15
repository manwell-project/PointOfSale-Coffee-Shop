// Reuse server's db helper to share a single sqlite3 connection
const path = require('path');
const serverDb = require(path.join(__dirname, '..', '..', 'server', 'db', 'connection'));

// Export helpers that models can use (run/get/all/transaction)
module.exports = serverDb.dbHelpers;
