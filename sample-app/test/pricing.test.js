const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTotal } = require('../src/pricing');

const items = [
  { sku: 'MUG', price: 12.5, qty: 2 },
  { sku: 'TEE', price: 20, qty: 1 },
];

test('totals without a discount', () => {
  const t = calculateTotal(items);
  assert.equal(t.subtotal, 45);
  assert.equal(t.discount, 0);
  assert.equal(t.tax, 3.15);
  assert.equal(t.total, 48.15);
});

test('applies a percentage discount before tax', () => {
  const t = calculateTotal(items, 10);
  assert.equal(t.discount, 4.5);
  assert.equal(t.tax, 2.84);
});

test('tax rounds to the nearest cent', () => {
  const t = calculateTotal([{ sku: 'CAP', price: 10.05, qty: 3 }]);
  assert.equal(t.tax, 2.11);
});
