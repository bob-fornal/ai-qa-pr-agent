const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { config } = require('./config');
const { createDb, runMigrations } = require('./db');
const { login, verify, hasRole } = require('./auth');
const orders = require('./orders');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const STATIC_TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function currentUser(req) {
  const header = req.headers.authorization || '';
  return verify(header.replace(/^Bearer /, ''));
}

function serveStatic(res, urlPath) {
  const file = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file)) return send(res, 404, { error: 'Not found' });
  send(res, 200, fs.readFileSync(file), STATIC_TYPES[path.extname(file)] || 'text/plain');
}

function createApp({ db = createDb(config.dataFile) } = {}) {
  runMigrations(db);

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return send(res, 200, { status: 'ok', features: config.features });
      }

      if (req.method === 'POST' && url.pathname === '/api/login') {
        const { username } = await readJson(req);
        const token = login(username);
        return token ? send(res, 200, { token }) : send(res, 401, { error: 'Unknown user' });
      }

      if (parts[0] === 'api' && parts[1] === 'orders') {
        const user = currentUser(req);
        if (!user) return send(res, 401, { error: 'Unauthorized' });
        const id = parts[2];

        if (req.method === 'GET' && id === 'export') {
          if (!hasRole(user, ['admin'])) return send(res, 403, { error: 'Forbidden' });
          const rows = orders.listOrders(db).map((o) =>
            [o.id, o.customerEmail, o.status, o.discountPct, o.approvalStatus ?? '', o.totalCents].join(','),
          );
          const csv = ['id,customerEmail,status,discountPct,approvalStatus,totalCents', ...rows].join('\n');
          return send(res, 200, csv, 'text/csv');
        }
        if (req.method === 'GET' && parts.length === 3) {
          return send(res, 200, orders.getOrder(db, id));
        }
        if (req.method === 'POST' && parts[3] === 'discount' && parts[4] === 'review') {
          if (user.role === 'sales') return send(res, 403, { error: 'Only managers can review discounts' });
          const { decision } = await readJson(req);
          return send(res, 200, orders.reviewDiscount(db, id, user, decision));
        }
        if (req.method === 'POST' && parts[3] === 'discount') {
          if (!hasRole(user, ['sales', 'manager', 'admin'])) return send(res, 403, { error: 'Forbidden' });
          const { discountPct } = await readJson(req);
          return send(res, 200, orders.setDiscount(db, id, discountPct));
        }
        if (req.method === 'POST' && parts[3] === 'checkout') {
          return send(res, 200, orders.checkout(db, id));
        }
      }

      if (req.method === 'GET') return serveStatic(res, url.pathname);
      send(res, 404, { error: 'Not found' });
    } catch (err) {
      if (err instanceof orders.OrderError) return send(res, err.status, { error: err.message });
      console.error(err);
      send(res, 500, { error: 'Internal error' });
    }
  });
}

if (require.main === module) {
  createApp().listen(config.port, () => console.log(`Order service on http://localhost:${config.port}`));
}

module.exports = { createApp };
