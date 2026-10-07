let token = null;

const $ = (id) => document.getElementById(id);
const money = (n) => `$${n.toFixed(2)}`;

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
  $('subtotal').textContent = money(order.subtotal);
  $('discount').textContent = `${money(order.discount)} (${order.discountPct}%)`;
  $('tax').textContent = money(order.tax);
  $('total').textContent = money(order.total);
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
