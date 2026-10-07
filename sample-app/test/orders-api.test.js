const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/server');
const { createDb } = require('../src/db');

async function startServer() {
  const server = createApp({ db: createDb(':memory:') });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  return { server, base };
}

async function tokenFor(base, username) {
  const res = await fetch(`${base}/api/login`, { method: 'POST', body: JSON.stringify({ username }) });
  return (await res.json()).token;
}

test('orders API', async (t) => {
  const { server, base } = await startServer();
  t.after(() => server.close());
  const auth = { Authorization: `Bearer ${await tokenFor(base, 'sam')}` };

  await t.test('health check responds', async () => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
  });

  await t.test('requires authentication', async () => {
    const res = await fetch(`${base}/api/orders/1001`);
    assert.equal(res.status, 401);
  });

  await t.test('returns an order with totals', async () => {
    const res = await fetch(`${base}/api/orders/1001`, { headers: auth });
    const order = await res.json();
    assert.equal(res.status, 200);
    assert.equal(order.totalCents, 4815);
  });

  await t.test('checkout marks the order paid', async () => {
    const res = await fetch(`${base}/api/orders/1002/checkout`, { method: 'POST', headers: auth });
    const order = await res.json();
    assert.equal(order.status, 'paid');
  });

  await t.test('cannot checkout a paid order', async () => {
    const res = await fetch(`${base}/api/orders/1003/checkout`, { method: 'POST', headers: auth });
    assert.equal(res.status, 409);
  });
});
