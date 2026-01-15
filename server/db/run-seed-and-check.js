const path = require('path');
const models = require(path.join(__dirname, 'models', 'index.js'));

console.log('DEBUG: models export keys =', Object.keys(models));

async function seed() {
  // Seeding dinonaktifkan, database akan tetap kosong
  console.log('Seeding dilewati. Database tetap kosong.');
}

async function checkCounts() {
  console.log('--- Counts ---');
  console.log('products:', (await models.products.all()).length);
  console.log('stocks:', (await models.stocks.all()).length);
  console.log('employees:', (await models.employees.all()).length);
  console.log('customers:', (await models.customers.all()).length);
  console.log('transactions:', (await models.transactions.all()).length);
}

(async () => {
  try {
    await seed();
    await checkCounts();
  } catch (err) {
    console.error('Error during seeding/check:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
