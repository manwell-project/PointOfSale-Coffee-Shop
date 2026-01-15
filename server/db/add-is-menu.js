const { dbHelpers } = require('./connection');

(async function(){
  try{
    await dbHelpers.run('ALTER TABLE products ADD COLUMN is_menu INTEGER DEFAULT 1');
    console.log('ALTER success');
    process.exit(0);
  }catch(err){
    console.error('ALTER failed:', err.message || err);
    process.exit(1);
  }
})();
