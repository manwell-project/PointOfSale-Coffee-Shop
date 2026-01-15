const path = require('path');
const models = require(path.join(__dirname, 'models', 'index.js'));
console.log('DEBUG: models export keys =', Object.keys(models));
console.log('DEBUG: products export =', typeof models.products.create === 'function' ? 'async function' : typeof models.products.create);

async function seed() {
  console.log('Seeding products...');
  // Insert products if not exists (idempotent)
  async function ensureProduct(name, category, price, description) {
    const allProducts = await models.products.all();
    const existing = allProducts.find(p => p.name === name);
    if (existing) return existing;
    return await models.products.create(name, category, price, description);
  }

  const p1 = await ensureProduct('Espresso', 'Coffee', 20000, 'Kopi espresso murni');
  const p2 = await ensureProduct('Cappuccino', 'Coffee', 25000, 'Espresso dengan susu');
  const p3 = await ensureProduct('Latte', 'Coffee', 23000, 'Kopi dengan susu hangat');

  console.log('Seeding stocks...');
  await models.stocks.add(p1.id, 50, 5);
  await models.stocks.add(p2.id, 2, 5);

  console.log('Seeding employees...');
  await models.employees.add('Budi Santoso', 'Pagi', '08123456789', 'budi@coffee.com');
  await models.employees.add('Sari Dewi', 'Siang', '08123456790', 'sari@coffee.com');

  console.log('Seeding customers...');
  await models.customers.add('Ani', '081298765432', 'ani@mail.com');
  await models.customers.add('Doni', '081233344455', 'doni@mail.com');

  console.log('Seeding completed.');
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
    console.error('Error during seeding/check:', err && err.message ? err.message : err);
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
