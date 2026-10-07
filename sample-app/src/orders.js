const { calculateTotal } = require('./pricing');

class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function getOrder(db, id) {
  const order = db.get('orders', id);
  if (!order) throw new OrderError(404, 'Order not found');
  return { ...order, ...calculateTotal(order.items, order.discountPct) };
}

function setDiscount(db, id, discountPct) {
  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 50) {
    throw new OrderError(400, 'discountPct must be between 0 and 50');
  }
  const order = db.get('orders', id);
  if (!order) throw new OrderError(404, 'Order not found');
  if (order.status !== 'open') throw new OrderError(409, 'Order is not open');
  db.update('orders', id, { discountPct });
  db.save();
  return getOrder(db, id);
}

function checkout(db, id) {
  const order = getOrder(db, id);
  if (order.status !== 'open') throw new OrderError(409, 'Order is not open');
  db.update('orders', id, { status: 'paid', paidTotal: order.total });
  db.save();
  return getOrder(db, id);
}

module.exports = { getOrder, setDiscount, checkout, OrderError };
