const { config } = require('./config');

const toCents = (dollars) => Math.round(dollars * 100);

// Returns order totals in integer cents. When discount approval is enabled,
// discounts above the threshold are only applied once approved.
function calculateTotal(items, { pct = 0, approved = false } = {}) {
  const subtotalCents = items.reduce((sum, item) => sum + toCents(item.price) * item.qty, 0);
  const needsApproval = config.features.discountApproval && pct > config.discountApprovalThreshold;
  const pending = needsApproval && !approved;
  const discountCents = pending ? 0 : Math.round((subtotalCents * pct) / 100);
  const taxCents = Math.round((subtotalCents - discountCents) * config.taxRate);

  return {
    subtotalCents,
    discountCents,
    taxCents,
    totalCents: subtotalCents - discountCents + taxCents,
    discountStatus: !pct ? 'none' : pending ? 'pending_approval' : 'applied',
  };
}

module.exports = { calculateTotal, toCents };
