const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB. Adding kds_status column...');
    
    // Add column if it doesn't exist
    await client.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS kds_status VARCHAR(20) DEFAULT 'pending';
    `);

    // Ensure existing rows are set to something, though DEFAULT handles future ones.
    await client.query(`
      UPDATE transactions 
      SET kds_status = 'completed' 
      WHERE kds_status IS NULL;
    `);

    console.log('Column kds_status added successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
