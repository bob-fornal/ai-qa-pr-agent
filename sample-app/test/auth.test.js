const test = require('node:test');
const assert = require('node:assert/strict');
const { login, verify, hasRole } = require('../src/auth');

test('login returns a verifiable token with the user role', () => {
  const user = verify(login('maria'));
  assert.deepEqual(user, { sub: 'maria', role: 'manager' });
});

test('unknown users cannot log in', () => {
  assert.equal(login('mallory'), null);
});

test('tampered tokens are rejected', () => {
  const [, sig] = login('sam').split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'sam', role: 'admin' })).toString('base64url');
  assert.equal(verify(`${forged}.${sig}`), null);
});

test('hasRole checks against an allow-list', () => {
  assert.equal(hasRole({ role: 'sales' }, ['manager', 'admin']), false);
  assert.equal(hasRole({ role: 'admin' }, ['manager', 'admin']), true);
  assert.equal(hasRole(null, ['admin']), false);
});
