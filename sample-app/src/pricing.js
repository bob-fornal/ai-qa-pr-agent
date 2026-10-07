const { config } = require('./config');

// Returns order totals in dollars.
function calculateTotal(items, discountPct = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = subtotal * (discountPct / 100);
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * config.taxRate * 100) / 100;
  return { subtotal, discount, tax, total: taxable + tax };
}

module.exports = { calculateTotal };
