// ທົດສອບທຸກກຸ່ມ (7 ກຸ່ມ) ຕັ້ງແຕ່ຕົ້ນຈົນຈົບ: KPI (HR ກວດ → ພະນັກງານຕົກລົງ → ອະນຸມັດ) → ຟອມ ①②③④ → ຜົນ = 100%
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const R = __dirname + '/../';
const { handle } = require(R + 'src/server.js');
const SC = require(R + 'src/scoring.js');
const { memStore } = require(R + 'tests/helpers.js');
const C = SC.DEFAULT_CONFIG;
const hash = s => crypto.createHash('sha256').update('salt' + s).digest('hex');
const mk = (code, group, sup, roles = [], dept = 'ບໍລິຫານ') => ({ code, name: 'ຄົນ ' + code, dept, div: '', pos: group || 'ຜູ້ບໍລິຫານ', group, sup, appr: '', roles, active: true, pin: hash('1234'), fails: 0, lockUntil: 0 });
const staff = [
  mk('P01', '', '', ['PRESIDENT']), mk('D01', '', 'P01'), mk('H01', 'SPEC', 'D01', ['HR'], 'HR'),
  mk('HD', 'HEAD_DEPT', 'D01', [], 'A'), mk('HS', 'HEAD_SEC', 'HD', [], 'A'), mk('SN', 'SENIOR', 'HD', [], 'B'),
  mk('SP', 'SPEC', 'HS', [], 'A'), mk('SP2', 'SPEC', 'HS', [], 'B'), mk('SV', 'SERVICE', 'HD', [], 'C'), mk('AU', 'AUDIT', 'D01', [], 'D'), mk('SE', 'SECRET', 'D01', [], 'E')
];
const store = memStore({ staff, rounds: [{ id: 'R1', name: 'test', status: 'setup', at: 0 }], kpi: [], peers: [], answers: [], sessions: [], results: [], config: null });
const tok = {};
for (const s of staff) tok[s.code] = handle({ a: 'login', code: s.code, pin: '1234' }, store).token;
const as = c => (a, x) => handle(Object.assign({ a, t: tok[c] }, x || {}), store);
const ok = r => { assert.equal(r.ok, true, r.err); return r; };
const evald = staff.filter(s => C.groups[s.group]);
const HR = as('H01');

// 1) KPI: each supervisor sets 2 items = group's weight I; full approval chain
for (const e of evald) {
  const w = C.groups[e.group].w[0];
  ok(as(e.sup)('kpiSave', { emp: e.code, items: [{ t: 'ຕົວຊີ້ວັດ 1', target: 'x', w: w - 5 }, { t: 'ຕົວຊີ້ວັດ 2', target: '', w: 5 }] }));
  ok(as(e.sup)('kpiSubmit', { emp: e.code }));
  ok(HR('kpiHr', { emp: e.code, ok: true }));
  ok(as(e.code)('kpiAck', { ok: true }));
  let st = store.raw().kpi.find(k => k.emp === e.code).status;
  if (st === 'appr') { const who = Object.keys(tok).find(c => ok(as(c)('boot')).boot.duties.some(d => d.kind === 'kpiAppr' && d.emp === e.code)); assert.ok(who, 'no approver for ' + e.code); ok(as(who)('kpiAppr', { emp: e.code, ok: true })); }
  ok(as('P01')('kpiPres', { emps: [e.code], ok: true }));
  assert.equal(store.raw().kpi.find(k => k.emp === e.code).status, 'ok', 'KPI not approved ' + e.code);
}
// 2) peers: 2 valid peers each (not self / sup / direct sub)
const bySup = c => staff.filter(s => s.sup === c).map(s => s.code);
for (const e of evald) {
  const cands = staff.filter(p => p.code !== e.code && p.code !== e.sup && p.sup !== e.code && C.groups[p.group]).slice(0, 2).map(p => p.code);
  ok(HR('peerSet', { emp: e.code, peers: cands }));
}
ok(HR('roundStatus', { id: 'R1', status: 'eval' }));

// 3) who must fill which forms (from the duty lists the server hands out)
const need = {};   // emp -> {1:[by],2:[by],3:[by],4:[by]}
for (const s of staff) for (const d of ok(as(s.code)('boot')).boot.duties) {
  if (!/^f[1-4]$/.test(d.kind)) continue;
  const n = Number(d.kind[1]); need[d.emp] = need[d.emp] || { 1: [], 2: [], 3: [], 4: [] }; need[d.emp][n].push(s.code);
  assert.ok(!d.blocked, `blocked duty ${d.kind} ${d.emp}`);
}
for (const e of evald) {
  const n = need[e.code], g = C.groups[e.group], leader = g.split.sub > 0 && staff.some(s => s.sup === e.code);
  const types = [1, 2, 3, 4].filter(k => n[k].length);
  assert.deepEqual(n[1], [e.sup]); assert.deepEqual(n[2], [e.sup]);
  assert.equal(n[3].length, 2);
  if (leader) { assert.deepEqual(n[4].sort(), bySup(e.code).sort(), 'form4 subs ' + e.code); assert.equal(types.length, 4); }
  else { assert.equal(n[4].length, 0); assert.equal(types.length, 3); }
}

// 4) submit every form with MAX answers (and check question counts per group)
const rate = n => Array(n).fill(5);
for (const e of evald) {
  const g = C.groups[e.group], Q = C.questions;
  const f1 = { i: [100, 100], iii: rate(g.iii.length), iv: g.w[3] ? rate(g.iv.length) : [], str: 'ດີ', imp: '', cmt: '' };
  ok(as(e.sup)('answerSubmit', { form: 1, emp: e.code, ans: f1 }));
  ok(as(e.sup)('answerSubmit', { form: 2, emp: e.code, ans: { q: rate(Q[g.q2].length), s: rate(Q.sac.length) } }));
  for (const by of need[e.code][3]) ok(as(by)('answerSubmit', { form: 3, emp: e.code, ans: { q: rate(Q.peer.length) } }));
  for (const by of need[e.code][4]) ok(as(by)('answerSubmit', { form: 4, emp: e.code, ans: { q: rate(Q.sub.length) } }));
}
ok(HR('roundStatus', { id: 'R1', status: 'closed' }));
const res = ok(HR('boot')).boot.results;
for (const e of evald) {
  const r = res.find(x => x.emp === e.code), g = C.groups[e.group];
  assert.equal(r.total, 100); assert.equal(r.grade, 'A'); assert.equal(r.redistributed, false);
}
console.log('groups: all passed (' + evald.length + ' people, 7 groups)');
