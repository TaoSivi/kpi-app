const assert = require('node:assert/strict');
const { handle } = require('../src/server.js');
const { memStore } = require('./helpers.js');

const store = memStore();
const tok = {};
const as = code => (a, extra) => handle(Object.assign({ a, t: tok[code] }, extra || {}), store);
const ok = r => { assert.equal(r.ok, true, r.err); return r; };
const bad = (r, re) => { assert.equal(r.ok, false, 'expected error'); if (re) assert.match(r.err, re); return r; };
const login = (code, pin = '1234') => handle({ a: 'login', code, pin }, store);
const fives = n => Array(n).fill(5);

// --- login ---
bad(handle({ a: 'boot' }, store));
for (let i = 0; i < 5; i++) bad(login('S01', '0000'));
bad(login('S01'), /15 ນາທີ/);
store.tick(16 * 60e3);
for (const c of ['P01', 'D01', 'HD1', 'HD2', 'H01', 'HS1', 'S01', 'S02', 'S03', 'V01', 'V02', 'A01', 'X01']) {
  const r = ok(login(c.toLowerCase())); tok[c] = r.token;
  assert.ok(!JSON.stringify(r.boot.staff).includes('"pin"'), 'pin leaked');
}
const P = as('P01'), D = as('D01'), HD1 = as('HD1'), HD2 = as('HD2'), HR = as('H01'), HS1 = as('HS1'),
  S01 = as('S01'), S02 = as('S02'), S03 = as('S03'), V01 = as('V01');

// --- KPI chain for S01 (SPEC, I = 75; sup HS1, approver = HD2, president P01) ---
bad(S02('kpiSave', { emp: 'S01', items: [{ t: 'x', target: '', w: 75 }] }), /ສິດ/);
ok(HS1('kpiSave', { emp: 'S01', items: [{ t: 'ປິດບັນຊີ', target: 'ວັນທີ 5', w: 50 }, { t: 'ລາຍງານ', target: '', w: 20 }] }));
bad(HS1('kpiSubmit', { emp: 'S01' }), /75/);
ok(HS1('kpiSave', { emp: 'S01', items: [{ t: 'ປິດບັນຊີ', target: 'ວັນທີ 5', w: 50 }, { t: 'ລາຍງານ', target: '', w: 25 }] }));
ok(HS1('kpiSubmit', { emp: 'S01' }));
// manual order: HR checks first, then the employee agrees, then approver, then president
assert.ok(!ok(S01('boot')).boot.duties.some(d => d.kind === 'kpiAck'));
assert.equal(ok(S01('boot')).boot.kpi.length, 0);                 // employee can't see it while HR is checking
assert.ok(ok(HR('boot')).boot.duties.some(d => d.kind === 'kpiHr' && d.emp === 'S01'));
bad(S01('kpiAck', { ok: true }), /ລໍຖ້າ/);                        // too early
bad(HD2('kpiAppr', { emp: 'S01', ok: true }));
ok(HR('kpiHr', { emp: 'S01', ok: true }));
assert.ok(ok(S01('boot')).boot.duties.some(d => d.kind === 'kpiAck'));
bad(HD2('kpiAppr', { emp: 'S01', ok: true }));                    // still needs the employee
bad(S01('kpiAck', { ok: false }), /ເຫດຜົນ/);
ok(S01('kpiAck', { ok: true }));
assert.ok(ok(HD2('boot')).boot.duties.some(d => d.kind === 'kpiAppr' && d.emp === 'S01'));
bad(D('kpiAppr', { emp: 'S01', ok: true }), /ສິດ/);
ok(HD2('kpiAppr', { emp: 'S01', ok: true }));
ok(P('kpiPres', { emps: ['S01'], ok: true }));
assert.equal(store.raw().kpi.find(k => k.emp === 'S01').status, 'ok');

// helper to push a KPI all the way to ok
function approveAll(emp, supFn, w) {
  ok(supFn('kpiSave', { emp, items: [{ t: 'ໜ້າທີ່', target: '', w }] }));
  ok(supFn('kpiSubmit', { emp }));
  ok(HR('kpiHr', { emp, ok: true }));
  ok(as(emp)('kpiAck', { ok: true }));
  const k = store.raw().kpi.find(k => k.emp === emp);
  if (k.status === 'appr') {
    const appr = handle({ a: 'boot', t: tok.H01 }, store).boot.staff.find(s => s.code === emp);
    // approver resolved by server; find whoever has the duty
    const who = Object.keys(tok).find(c => handle({ a: 'boot', t: tok[c] }, store).boot.duties.some(d => d.kind === 'kpiAppr' && d.emp === emp));
    assert.ok(who, 'no approver for ' + emp + JSON.stringify(appr));
    ok(as(who)('kpiAppr', { emp, ok: true }));
  }
  ok(P('kpiPres', { emps: [emp], ok: true }));
}
approveAll('HS1', HD2, 65);
approveAll('S03', HD2, 70);

// return path requires msg and goes back to draft
ok(HD1('kpiSave', { emp: 'V01', items: [{ t: 'ຂັບລົດປອດໄພ', target: '0 ອຸບັດຕິເຫດ', w: 80 }] }));
ok(HD1('kpiSubmit', { emp: 'V01' }));
bad(HR('kpiHr', { emp: 'V01', ok: false }), /ເຫດຜົນ/);
ok(HR('kpiHr', { emp: 'V01', ok: false, msg: 'ເພີ່ມຕົວຊີ້ວັດ' }));
assert.equal(store.raw().kpi.find(k => k.emp === 'V01').status, 'draft');
// employee may also decline after HR passed → back to draft
ok(HD1('kpiSubmit', { emp: 'V01' })); ok(HR('kpiHr', { emp: 'V01', ok: true }));
bad(V01('kpiAck', { ok: false }), /ເຫດຜົນ/);
ok(V01('kpiAck', { ok: false, msg: 'ຂໍປັບເປົ້າໝາຍ' }));
assert.equal(store.raw().kpi.find(k => k.emp === 'V01').status, 'draft');

// --- peers ---
bad(HR('peerSet', { emp: 'S01', peers: ['S01'] }));
bad(HR('peerSet', { emp: 'S01', peers: ['HS1'] }));    // own supervisor
bad(HR('peerSet', { emp: 'HS1', peers: ['S01'] }));    // own subordinate
bad(S02('peerSet', { emp: 'S01', peers: ['V01'] }), /ສິດ/);
ok(HR('peerSet', { emp: 'S01', peers: ['V01', 'A01'] }));
ok(HR('peerSet', { emp: 'HS1', peers: ['X01'] }));

// --- answers ---
const f1S01 = { i: [90, 80], iii: [4, 4, 4, 4, 4, 4], iv: [5, 5, 5], str: 'ຂະຫຍັນ', imp: '', cmt: '' };
bad(HS1('answerSubmit', { form: 1, emp: 'S01', ans: f1S01 }), /ປະເມີນ/);   // round still setup
bad(S01('roundStatus', { id: 'R2026', status: 'eval' }), /ສິດ/);
ok(HR('roundStatus', { id: 'R2026', status: 'eval' }));
bad(HS1('answerSubmit', { form: 1, emp: 'S02', ans: f1S01 }), /KPI/);       // S02 KPI not approved
bad(HS1('answerSubmit', { form: 1, emp: 'S01', ans: Object.assign({}, f1S01, { iii: [4, 4] }) }));
bad(HS1('answerSubmit', { form: 1, emp: 'S01', ans: Object.assign({}, f1S01, { i: [101, 80] }) }));
ok(HS1('answerSubmit', { form: 1, emp: 'S01', ans: f1S01 }));
bad(HS1('answerSubmit', { form: 1, emp: 'S01', ans: f1S01 }), /ແລ້ວ/);       // double submit
assert.equal(store.raw().answers.filter(a => a.form === 1 && a.emp === 'S01').length, 1);
ok(HS1('answerSubmit', { form: 2, emp: 'S01', ans: { q: [4, 4, 4, 4, 4], s: [5, 5] } }));
bad(S02('answerSubmit', { form: 3, emp: 'S01', ans: { q: fives(5) } }), /ສິດ/);  // not assigned
ok(V01('answerSubmit', { form: 3, emp: 'S01', ans: { q: [3, 3, 3, 3, 3] } }));
bad(S01('answerSubmit', { form: 4, emp: 'HS1', ans: { q: [3, 3, 3] } }));     // wrong length
ok(S01('answerSubmit', { form: 4, emp: 'HS1', ans: { q: [3, 3, 3, 3, 3, 3] } }));
bad(HS1('answerSubmit', { form: 4, emp: 'S03', ans: { q: fives(6) } }), /ສິດ/); // S03 is not HS1's supervisor
// HEAD_SEC HS1: sup HD2 fills f1/f2
ok(HD2('answerSubmit', { form: 1, emp: 'HS1', ans: { i: [100], iii: fives(6), iv: fives(3) } }));
ok(HD2('answerSubmit', { form: 2, emp: 'HS1', ans: { q: fives(6), s: fives(2) } }));

// anonymity: S01 never receives others' f3/f4 rows
{
  const b = ok(S01('boot')).boot;
  assert.ok(b.answersMine.every(a => a.by === 'S01'));
  assert.equal(b.results.length, 0);                     // not published
}

// --- supervisor change mid-round ---
ok(HR('staffSave', { row: Object.assign({}, store.raw().staff.find(s => s.code === 'S02'), { sup: 'HD2' }) }));
assert.ok(ok(HD2('boot')).boot.duties.some(d => d.kind === 'f2' && d.emp === 'S02'));
assert.ok(!ok(HS1('boot')).boot.duties.some(d => d.emp === 'S02'));
bad(HR('staffSave', { row: Object.assign({}, store.raw().staff.find(s => s.code === 'HD2'), { sup: 'S02' }) }), /ວົງ/); // cycle
bad(HR('staffSave', { row: Object.assign({}, store.raw().staff.find(s => s.code === 'H01'), { roles: [] }) }), /HR/); // last HR

// --- close + publish ---
ok(HR('roundStatus', { id: 'R2026', status: 'closed' }));
{
  const hr = ok(HR('boot')).boot.results.find(r => r.emp === 'S01');
  assert.equal(hr.total, 85.6); assert.equal(hr.grade, 'B');
  assert.equal(hr.parts.peer, 60);
  assert.equal(ok(S01('boot')).boot.results.length, 0);
  assert.ok(store.raw().results.some(r => r.emp === 'S01' && r.total === 85.6));
}
ok(HR('roundStatus', { id: 'R2026', status: 'published' }));
{
  const mine = ok(S01('boot')).boot.results;
  assert.equal(mine.length, 1); assert.equal(mine[0].emp, 'S01');
  assert.equal(mine[0].parts.peer, null); assert.equal(mine[0].few.peer, true);   // only 1 peer answered
  const sup = ok(HD2('boot')).boot.results.find(r => r.emp === 'HS1');
  assert.equal(sup.parts.sub, null); assert.equal(sup.few.sub, true);             // only S01 answered f4
  assert.ok(!ok(HD2('boot')).boot.results.some(r => r.emp === 'S01'));            // not a direct sub
}
ok(HR('roundCreate', { name: 'ປີ 2027', copyKpi: true }));
bad(HR('roundCreate', { name: 'ຊ້ຳ' }), /ເປີດ/);
{
  const b = ok(HS1('boot')).boot;
  assert.equal(b.round.name, 'ປີ 2027');
  const k = store.raw().kpi.find(k => k.round === b.round.id && k.emp === 'S01');
  assert.equal(k.status, 'draft'); assert.equal(k.items.length, 2);
}
// batch PIN + batch peers (atomic: one bad item → nothing saved)
bad(HR('setPin', { list: [{ code: 'S02', pin: '5555' }, { code: 'S03', pin: '12' }] }), /PIN/);
bad(login('S02', '5555'));
ok(HR('setPin', { list: [{ code: 'S02', pin: '5555' }, { code: 'S03', pin: '666666' }] }));
ok(login('S02', '5555')); ok(login('S03', '666666'));
ok(HR('peerSet', { list: [{ emp: 'S01', peers: ['V01'] }, { emp: 'S02', peers: ['A01', 'X01'] }] }));
assert.equal(store.raw().peers.filter(p => p.emp === 'S02').length, 2);
bad(HR('peerSet', { list: [{ emp: 'S01', peers: ['V02'] }, { emp: 'S02', peers: ['S02'] }] }));
assert.ok(!store.raw().peers.some(p => p.by === 'V02'));
ok(as('S01')('logout'));
bad(S01('boot'));
console.log('server: all passed');
