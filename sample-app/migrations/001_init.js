// Seed orders for local development and tests.
exports.up = (db) => {
  db.insert('orders', {
    id: '1001',
    customerEmail: 'pat@example.com',
    status: 'open',
    discountPct: 0,
    items: [
      { sku: 'MUG', price: 12.5, qty: 2 },
      { sku: 'TEE', price: 20, qty: 1 },
    ],
  });
  db.insert('orders', {
    id: '1002',
    customerEmail: 'lee@example.com',
    status: 'open',
    discountPct: 10,
    items: [{ sku: 'HOODIE', price: 45, qty: 1 }],
  });
  db.insert('orders', {
    id: '1003',
    customerEmail: 'kim@example.com',
    status: 'paid',
    discountPct: 0,
    items: [{ sku: 'CAP', price: 10.05, qty: 3 }],
  });
};
