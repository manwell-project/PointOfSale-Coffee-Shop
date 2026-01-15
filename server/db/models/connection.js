// Bridge to server DB helpers. This module re-exports the dbHelpers from server/db/connection.js
const path = require('path');
const serverDb = require(path.join(__dirname, '..', 'connection'));
module.exports = serverDb.dbHelpers;
