const { dbHelpers } = require('./server/db/connection');
async function test() {
  const stockBefore = await dbHelpers.get('SELECT * FROM stocks WHERE product_id = 1');
  console.log('Stock Before:', stockBefore);
  
  const res = await fetch('http://localhost:3000/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ product_id: 1, quantity: 2, unit_price: 20000, subtotal: 40000 }],
      total_amount: 40000,
      payment_method: 'cash'
    })
  });
  console.log('Post Status:', res.status, await res.json());

  const stockAfter = await dbHelpers.get('SELECT * FROM stocks WHERE product_id = 1');
  console.log('Stock After:', stockAfter);
}
test();
