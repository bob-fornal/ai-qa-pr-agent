const { calculateTotal } = require('./pricing');
const { config } = require('./config');
const { notifyDiscountPending } = require('./notifier');

class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function totalsFor(order) {
  return calculateTotal(order.items, { pct: order.discountPct, approved: order.approvalStatus === 'approved' });
}

function getOrder(db, id) {
  const order = db.get('orders', id);
  if (!order) throw new OrderError(404, 'Order not found');
  return { ...order, ...totalsFor(order) };
}

function listOrders(db) {
  return db.all('orders').map((order) => ({ ...order, ...totalsFor(order) }));
}

function setDiscount(db, id, discountPct) {
  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 50) {
    throw new OrderError(400, 'discountPct must be between 0 and 50');
  }
  const order = db.get('orders', id);
  if (!order) throw new OrderError(404, 'Order not found');
  if (order.status !== 'open') throw new OrderError(409, 'Order is not open');

  const needsApproval = config.features.discountApproval && discountPct > config.discountApprovalThreshold;
  db.update('orders', id, { discountPct, approvalStatus: needsApproval ? 'pending' : null, approvedBy: null });
  db.save();
  if (needsApproval) notifyDiscountPending(db.get('orders', id));
  return getOrder(db, id);
}

function reviewDiscount(db, id, user, decision) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new OrderError(400, 'decision must be "approved" or "rejected"');
  }
  const order = db.get('orders', id);
  if (!order) throw new OrderError(404, 'Order not found');
  if (order.approvalStatus !== 'pending') throw new OrderError(409, 'No discount pending approval');

  const patch =
    decision === 'approved'
      ? { approvalStatus: 'approved', approvedBy: user.sub }
      : { approvalStatus: 'rejected', approvedBy: user.sub, discountPct: 0 };
  db.update('orders', id, patch);
  db.save();
  return getOrder(db, id);
}

function checkout(db, id) {
  const order = getOrder(db, id);
  if (order.status !== 'open') throw new OrderError(409, 'Order is not open');
  db.update('orders', id, { status: 'paid', paidTotalCents: order.totalCents });
  db.save();
  return getOrder(db, id);
}

module.exports = { getOrder, listOrders, setDiscount, reviewDiscount, checkout, OrderError };
