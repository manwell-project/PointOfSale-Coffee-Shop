require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DB_PATH = path.join(__dirname, 'digicaf.db');
const db = new sqlite3.Database(DB_PATH);

const tables = [
  'products', 'employees', 'customers', 'raw_materials',
  'stocks', 'discounts', 'raw_stocks',
  'transactions', 'stock_history', 'raw_stock_history',
  'transaction_items'
];

async function migrateData() {
  try {
    console.log('Starting data migration to Supabase...');

    for (const table of tables) {
      console.log(`Migrating table: ${table}...`);
      
      const rows = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${table}`, (err, data) => {
          if (err) {
             if(err.message.includes('no such table')) {
                 resolve([]);
             } else {
                 reject(err);
             }
          } else resolve(data);
        });
      });

      if (rows.length > 0) {
        // Delete existing data to prevent conflicts
        await supabase.from(table).delete().neq('id', 0);

        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { error } = await supabase.from(table).insert(batch);
          if (error) {
            console.error(`❌ Error inserting to ${table}:`, error);
          }
        }

        console.log(`✅ Inserted ${rows.length} rows into ${table}.`);
      } else {
        console.log(`⚠️ No data found in ${table}, skipping.`);
      }
    }

    console.log('🎉 Data Migration completed successfully!');
    console.log('\\n⚠️ IMPORTANT: You must reset the auto-increment sequences in Supabase SQL Editor so new inserts work properly.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    db.close();
    process.exit(0);
  }
}

migrateData();
