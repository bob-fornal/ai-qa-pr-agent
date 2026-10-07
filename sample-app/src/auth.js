const crypto = require('node:crypto');
const { config } = require('./config');

// Demo users. A real service would use an identity provider.
const USERS = {
  ada: { role: 'admin' },
  maria: { role: 'manager' },
  sam: { role: 'sales' },
};

function signature(body) {
  return crypto.createHmac('sha256', config.authSecret).update(body).digest('base64url');
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signature(body)}`;
}

function verify(token) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = signature(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
}

function login(username) {
  const user = USERS[username];
  if (!user) return null;
  return sign({ sub: username, role: user.role });
}

function hasRole(user, roles) {
  return Boolean(user) && roles.includes(user.role);
}

module.exports = { login, verify, hasRole, USERS };
