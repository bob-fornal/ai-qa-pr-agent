let token = null;

const $ = (id) => document.getElementById(id);
const money = (cents) => `$${(cents / 100).toFixed(2)}`;

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function render(order) {
  $('order').hidden = false;
  $('order-number').textContent = order.id;
  $('status').textContent = order.status;
  $('subtotal').textContent = money(order.subtotalCents);
  $('discount').textContent = `${money(order.discountCents)} (${order.discountPct}%)`;
  $('tax').textContent = money(order.taxCents);
  $('total').textContent = money(order.totalCents);
  $('approval-banner').hidden = order.discountStatus !== 'pending_approval';
  $('discount-pct').value = order.discountPct;
}

async function run(action) {
  $('message').textContent = '';
  try {
    render(await action());
  } catch (err) {
    $('message').textContent = err.message;
  }
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  ({ token } = await api('POST', '/api/login', { username: $('username').value }));
  $('order-form').hidden = false;
});

$('order-form').addEventListener('submit', (e) => {
  e.preventDefault();
  run(() => api('GET', `/api/orders/${$('order-id').value}`));
});

$('apply-discount').addEventListener('click', () =>
  run(() => api('POST', `/api/orders/${$('order-id').value}/discount`, { discountPct: Number($('discount-pct').value) })),
);

$('checkout').addEventListener('click', () => run(() => api('POST', `/api/orders/${$('order-id').value}/checkout`)));

const review = (decision) =>
  run(() => api('POST', `/api/orders/${$('order-id').value}/discount/review`, { decision }));
$('approve').addEventListener('click', () => review('approved'));
$('reject').addEventListener('click', () => review('rejected'));
