const assert = require('node:assert/strict');
const { handle } = require('../src/server.js');
const { memStore } = require('./helpers.js');

const store = memStore();
const tok = {};
const as = code => (a, extra) => handle(Object.assign({ a, t: tok[code] }, extra || {}), store);
const ok = r => { assert.equal(r.ok, true, r.err); return r; };
const bad = (r, re) => { assert.equal(r.ok, false, 'expected error'); if (re) assert.match(r.err, re); return r; };
for (const c of ['P01', 'H01', 'S01', 'S02', 'V01', 'HD1']) tok[c] = ok(handle({ a: 'login', code: c, pin: '1234' }, store)).token;
const HR = as('H01'), S01 = as('S01'), S02 = as('S02'), P = as('P01');
const row = code => Object.assign({}, store.raw().staff.find(s => s.code === code));

// defaults: 3 roles; H01 (HR) gets "roles" via bootstrap because nobody holds ADMIN
{
  const b = ok(HR('boot')).boot;
  assert.deepEqual(b.roles.map(r => r.code), ['ADMIN', 'HR', 'PRESIDENT']);
  assert.ok(b.me.perms.includes('roles') && b.me.perms.includes('staff'));
  assert.ok(!b.me.perms.includes('kpiFinal'));
  const s = ok(S01('boot')).boot;
  assert.deepEqual(s.me.perms, []);
  assert.equal(s.results.length, 0); assert.equal(s.hr, null);
  assert.ok(!('roles' in s.staff[0]));                       // plain staff don't see others' roles
  assert.ok(ok(P('boot')).boot.me.perms.includes('kpiFinal'));
}

// only "roles" holders manage roles
bad(S01('roleSave', { role: { code: 'HRASSIST', name: 'x', perms: ['peers'] } }), /ສິດ/);
bad(HR('roleSave', { role: { code: 'ADMIN', name: 'x', perms: [] } }), /Admin/);
bad(HR('roleSave', { role: { code: 'a', name: 'x', perms: [] } }), /ລະຫັດ/);
ok(HR('roleSave', { role: { code: 'hrassist', name: 'ຜູ້ຊ່ວຍ HR', perms: ['peers', 'progress', 'nonsense'] } }));
assert.deepEqual(store.raw().roles.find(r => r.code === 'HRASSIST').perms, ['peers', 'progress']);

// assign custom role: S02 can now set peers and see progress, but not edit staff or results
ok(HR('staffSave', { row: Object.assign(row('S02'), { roles: ['HRASSIST'] }) }));
{
  const b = ok(S02('boot')).boot;
  assert.deepEqual(b.me.perms.sort(), ['peers', 'progress']);
  assert.ok(b.hr && Array.isArray(b.hr.progress));
  assert.equal(b.results.length, 0);
}
ok(S02('peerSet', { emp: 'S01', peers: ['V01'] }));
bad(S02('staffSave', { row: row('S01') }), /ສິດ/);
bad(S02('roundStatus', { id: 'R2026', status: 'eval' }), /ສິດ/);
bad(S02('kpiHr', { emp: 'S01', ok: true }), /ສິດ/);

// escalation guard: someone with "staff" but not "roles" can't change roles
ok(HR('roleSave', { role: { code: 'CLERK', name: 'ພະນັກງານທະບຽນ', perms: ['staff'] } }));
ok(HR('staffSave', { row: Object.assign(row('V01'), { roles: ['CLERK'] }) }));
ok(HR('staffSave', { row: Object.assign(row('H01'), { roles: ['ADMIN'] }) }));    // H01 becomes ADMIN → bootstrap no longer applies
const V01 = as('V01');
assert.ok(!ok(V01('boot')).boot.me.perms.includes('roles'));
ok(V01('staffSave', { row: Object.assign(row('S01'), { pos: 'ວິຊາການບັນຊີ (ປ່ຽນ)' }) }));   // normal edit fine
bad(V01('staffSave', { row: Object.assign(row('V01'), { roles: ['ADMIN'] }) }), /ບົດບາດ/);
bad(V01('staffImport', { rows: [Object.assign(row('V02'), { roles: 'ADMIN' })] }), /ບົດບາດ/);
bad(V01('roleSave', { role: { code: 'CLERK', name: 'x', perms: ['roles'] } }), /ສິດ/);

// role edits take effect immediately; ADMIN keeps all perms even if stored data is edited
ok(HR('roleSave', { role: { code: 'HRASSIST', name: 'ຜູ້ຊ່ວຍ HR', perms: ['results'] } }));
assert.deepEqual(ok(S02('boot')).boot.me.perms, ['results']);
assert.ok(ok(S02('boot')).boot.results.length > 0);
store.raw().roles.find(r => r.code === 'ADMIN').perms = [];
assert.ok(ok(HR('boot')).boot.me.perms.includes('roles'));

// can't delete a role in use, ADMIN, or lock everybody out
bad(HR('roleDelete', { code: 'HRASSIST' }), /ພະນັກງານ/);
bad(HR('roleDelete', { code: 'ADMIN' }), /Admin/);
ok(HR('staffSave', { row: Object.assign(row('S02'), { roles: [] }) }));
ok(HR('roleDelete', { code: 'HRASSIST' }));
assert.ok(!store.raw().roles.some(r => r.code === 'HRASSIST'));
ok(HR('staffSave', { row: Object.assign(row('V01'), { roles: [] }) }));
bad(HR('staffSave', { row: Object.assign(row('H01'), { roles: [] }) }), /Admin/);   // last keeper
ok(HR('staffSave', { row: Object.assign(row('H01'), { roles: ['HR'] }) }));        // keeper via HR role (staff perm)
bad(HR('roleSave', { role: { code: 'HR', name: 'HR', perms: ['progress'] } }), /Admin/); // would leave nobody able to manage
assert.ok(ok(HR('boot')).boot.me.perms.includes('roles'));                        // bootstrap again: no ADMIN holder
console.log('roles: all passed');
