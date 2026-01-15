const path = require('path');
const models = require(path.join(__dirname, 'models', 'index.js'));

function seed() {
  console.log('Seeding products...');
  const p1 = models.products.create('SKU-ESP-001', 'Espresso', 12000);
  const p2 = models.products.create('SKU-LAT-001', 'Latte', 15000);
  const p3 = models.products.create('SKU-CAP-001', 'Cappuccino', 14000);

  console.log('Seeding stocks...');
  models.stocks.add('Espresso Beans', 50, 5, p1.id);
  models.stocks.add('Milk (liters)', 30, 5, p2.id);

  console.log('Seeding employees...');
  models.employees.add('Budi Santoso', 'Pagi', '08123456789', 'budi@coffee.com');
  models.employees.add('Sari Dewi', 'Siang', '08123456790', 'sari@coffee.com');

  console.log('Seeding customers...');
  models.customers.add('Ani', '081298765432', 'ani@mail.com', 'vip');
  models.customers.add('Doni', '081233344455', 'doni@mail.com', 'regular');

  console.log('Seeding completed.');
}

if (require.main === module) seed();
module.exports = seed;
