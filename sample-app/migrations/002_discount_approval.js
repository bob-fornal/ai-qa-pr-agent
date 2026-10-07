// Adds discount approval tracking and stores paid totals in integer cents.
exports.up = (db) => {
  for (const order of db.all('orders')) {
    const patch = { approvalStatus: null, approvedBy: null };
    if (order.paidTotal !== undefined) {
      patch.paidTotalCents = Math.round(order.paidTotal * 100);
      delete order.paidTotal;
    }
    db.update('orders', order.id, patch);
  }
};
