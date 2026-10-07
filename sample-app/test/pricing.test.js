const test = require('node:test');
const assert = require('node:assert/strict');
const { config } = require('../src/config');
const { calculateTotal } = require('../src/pricing');

const items = [
  { sku: 'MUG', price: 12.5, qty: 2 },
  { sku: 'TEE', price: 20, qty: 1 },
];

test('totals without a discount', () => {
  const t = calculateTotal(items);
  assert.equal(t.subtotalCents, 4500);
  assert.equal(t.discountCents, 0);
  assert.equal(t.taxCents, 315);
  assert.equal(t.totalCents, 4815);
});

test('applies a percentage discount before tax', () => {
  const t = calculateTotal(items, { pct: 10 });
  assert.equal(t.discountCents, 450);
  assert.equal(t.taxCents, 284);
});

// TODO: re-enable after the cents migration settles
test.skip('tax rounds to the nearest cent', () => {
  const t = calculateTotal([{ sku: 'CAP', price: 10.05, qty: 3 }]);
  assert.equal(t.taxCents, 211);
});

test('large discounts wait for approval when the feature is on', () => {
  config.features.discountApproval = true;
  const t = calculateTotal(items, { pct: 30 });
  assert.equal(t.discountCents, 0);
  assert.equal(t.discountStatus, 'pending_approval');
  config.features.discountApproval = false;
});
