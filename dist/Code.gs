/* ===== scoring.js ===== */
// ສູດຄິດໄລ່ KPI ຕາມຄູ່ມື ຂໍ້ 13–14. ໃຊ້ຮ່ວມກັນ: Apps Script, browser, node tests.
const III_STD = ['ວິໄນ ເວລາເຮັດວຽກ', 'ການປະຕິບັດຕາມລະບຽບ ແລະ ຄຳສັ່ງພາຍໃນ', 'ການປະຕິບັດຕາມຂັ້ນຕອນ ແລະ ມາດຕະຖານວຽກ',
  'ຄວາມຊື່ສັດ ແລະ ຈັນຍາບັນ', 'ຮັກສາຄວາມລັບທຸລະກິດ-ຄູ່ຮ່ວມມື', 'ການເປັນແບບຢ່າງ, ການເຂົ້າຮ່ວມກິດຈະກຳ ແລະ ສົ່ງເສີມວັດທະນະທຳອົງກອນ'];
const IV_STD = ['ການສ້າງ ແລະ ຮັກສາສາຍພົວພັນກັບພາກລັດ', 'ການຕິດຕາມ ແລະ ວິເຄາະສະພາບເສດຖະກິດ-ການເມືອງ', 'ຄວາມຮັບຜິດຊອບຕໍ່ສັງຄົມ'];
const LEAD = 'ພາວະຄວາມເປັນຜູ້ນຳ';
const SPLIT_HEAD = { sup: 50, sub: 30, peer: 10, sac: 10 };
const SPLIT_STD = { sup: 80, sub: 0, peer: 10, sac: 10 };

const DEFAULT_CONFIG = {
  orgName: 'ກຸ່ມບໍລິສັດ ລາວໃຕ້ ການຄ້າ ແລະ ການລົງທຶນ ຈຳກັດ',
  groups: {
    HEAD_DEPT: { name: 'ຫົວໜ້າ/ຮອງພະແນກ', w: [60, 20, 15, 5], split: SPLIT_HEAD, iiName: LEAD, q2: 'lead', iii: III_STD, iv: IV_STD },
    HEAD_SEC: { name: 'ຫົວໜ້າຂະແໜງ', w: [65, 15, 15, 5], split: SPLIT_HEAD, iiName: LEAD, q2: 'lead', iii: III_STD, iv: IV_STD },
    SENIOR: { name: 'ວິຊາການຂັ້ນສູງ', w: [70, 12, 15, 3], split: SPLIT_STD, iiName: LEAD, q2: 'lead', iii: III_STD, iv: IV_STD },
    SPEC: { name: 'ວິຊາການ', w: [75, 7, 15, 3], split: SPLIT_STD, iiName: LEAD, q2: 'staff', iii: III_STD, iv: IV_STD },
    SERVICE: {
      name: 'ບໍລິການ ແລະ ສະໜັບສະໜູນ', w: [80, 5, 15, 0], split: SPLIT_STD, iiName: 'ດ້ານທັດສະນະຄະຕິ', q2: 'staff',
      iii: III_STD.slice(0, 5).concat('ການເຂົ້າຮ່ວມກິດຈະກຳ ແລະ ສົ່ງເສີມວັດທະນະທຳອົງກອນ'), iv: []
    },
    AUDIT: {
      name: 'ຄະນະກວດສອບພາຍໃນ', w: [60, 20, 15, 5], split: SPLIT_STD, iiName: 'ຄວາມເປັນອິດສະຫຼະ ແລະ ຈັນຍາບັນ', q2: 'audit',
      iii: [III_STD[0], III_STD[1], 'ການປະຕິບັດຕາມຂັ້ນຕອນ ແລະ ມາດຕະຖານການກວດສອບ', III_STD[5]], iv: IV_STD
    },
    SECRET: { name: 'ຄະນະກອງເລຂາ', w: [50, 20, 25, 5], split: SPLIT_STD, iiName: LEAD, q2: 'lead', iii: [III_STD[0], III_STD[1], III_STD[2], III_STD[5]], iv: IV_STD }
  },
  questions: {
    lead: ['ວາງແຜນ ແລະ ມອບໝາຍວຽກໃຫ້ທີມຢ່າງຈະແຈ້ງ', 'ຕັດສິນໃຈ ແລະ ແກ້ໄຂບັນຫາໄດ້ທັນການ', 'ຕິດຕາມ ແລະ ຊຸກຍູ້ໃຫ້ທີມບັນລຸເປົ້າໝາຍ',
      'ສອນງານ ແລະ ພັດທະນາຄວາມສາມາດຂອງທີມ', 'ປະສານງານກັບພາກສ່ວນອື່ນໄດ້ດີ', 'ເປັນແບບຢ່າງ ແລະ ຮັບຜິດຊອບຕໍ່ຜົນງານ'],
    staff: ['ຮັບຜິດຊອບ ແລະ ເອົາໃຈໃສ່ຕໍ່ໜ້າທີ່', 'ຕັ້ງໃຈຮຽນຮູ້ ແລະ ປັບປຸງຕົນເອງ', 'ເຮັດວຽກເປັນທີມ ແລະ ຊ່ວຍເຫຼືອຄົນອື່ນ',
      'ມີຄວາມຄິດລິເລີ່ມ ສະເໜີວິທີເຮັດວຽກທີ່ດີຂຶ້ນ', 'ທັດສະນະຄະຕິທີ່ດີຕໍ່ວຽກ ແລະ ອົງກອນ'],
    audit: ['ຮັກສາຄວາມເປັນອິດສະຫຼະໃນການກວດສອບ', 'ລາຍງານຂໍ້ເທັດຈິງຢ່າງກົງໄປກົງມາ', 'ຮັກສາຄວາມລັບ',
      'ຫຼີກລ່ຽງຜົນປະໂຫຍດທັບຊ້ອນ', 'ຂໍ້ສະເໜີແນະມີຄຸນນະພາບ ນຳໄປປະຕິບັດໄດ້'],
    sac: ['ອາສາຮັບວຽກເພີ່ມ ຫຼື ເຮັດວຽກນອກເວລາເມື່ອຈຳເປັນ', 'ເອົາຜົນປະໂຫຍດຂອງອົງກອນເປັນຫຼັກ'],
    peer: ['ໃຫ້ຄວາມຮ່ວມມື ແລະ ຊ່ວຍເຫຼືອເມື່ອຖືກຂໍ', 'ສື່ສານຈະແຈ້ງ ແລະ ສຸພາບ', 'ສົ່ງວຽກທີ່ກ່ຽວຂ້ອງກັນ ທັນເວລາ ແລະ ເຊື່ອຖືໄດ້',
      'ເຄົາລົບ ແລະ ຮັບຟັງຄວາມຄິດເຫັນຂອງຄົນອື່ນ', 'ຮ່ວມແກ້ໄຂບັນຫາ ບໍ່ໂທດກັນ'],
    sub: ['ມອບໝາຍວຽກ ແລະ ເປົ້າໝາຍຈະແຈ້ງ', 'ຮັບຟັງຄວາມຄິດເຫັນຂອງລູກນ້ອງ', 'ປະຕິບັດຕໍ່ທຸກຄົນຢ່າງຍຸຕິທຳ',
      'ສອນງານ ແລະ ສະໜັບສະໜູນເມື່ອມີບັນຫາ', 'ຊົມເຊີຍ ແລະ ໃຫ້ກຳລັງໃຈເມື່ອເຮັດໄດ້ດີ', 'ເປັນແບບຢ່າງທີ່ດີ']
  },
  iTemplate: ['ໜ້າທີ່ຮັບຜິດຊອບ', 'ໜ້າທີ່ຮັບຜິດຊອບເພີ່ມ (ຖ້າມີ)', 'ຄວາມຮູ້ດ້ານວິຊາສະເພາະ', 'ຄວາມຮູ້ນຳໃຊ້ເຄື່ອງມືດ້ານເທັກໂນໂລຊີທັນສະໄຫມເຂົ້າໃນການເຮັດວຽກ (AI)']
};

const GRADES = [[95, 'A', 'ຜົນງານເກີນເປົ້າໝາຍ'], [85, 'B', 'ບັນລຸເປົ້າໝາຍຄົບຖ້ວນ'], [75, 'C', 'ຢູ່ໃນເກນມາດຕະຖານ (ຕ້ອງພັດທະນາຕື່ມ)'],
  [65, 'D', 'ຫຼຸດມາດຕະຖານ'], [-1, 'E', 'ບໍ່ຜ່ານມາດຕະຖານ']];

function pct15(arr) { return arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length / 5 * 100 : null; }
function round1(x) { return Math.round((x + 1e-9) * 10) / 10; }
function grade(total) { return total == null ? null : GRADES.find(g => total >= g[0])[1]; }
function gradeText(g) { const r = GRADES.find(x => x[1] === g); return r ? r[2] : ''; }
function hasSub(cfg, code) { const g = cfg.groups[code]; return !!g && g.split.sub > 0; }
function avg(list) { return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null; }

// items: KPI ດ້ານ I [{w}], f1 = {i:[% ບັນລຸ], iii:[1-5], iv:[1-5]}, f2 = {q:[1-5], s:[1-5]}, f3list/f4list = [{q:[1-5]}]
function score(cfg, code, items, f1, f2, f3list, f4list) {
  const g = cfg.groups[code], w = g.w, sp = g.split;
  const parts = {
    sup: f2 ? pct15(f2.q) : null,
    sac: f2 ? pct15(f2.s) : null,
    peer: avg((f3list || []).map(a => pct15(a.q))),
    sub: sp.sub > 0 ? avg((f4list || []).map(a => pct15(a.q))) : null
  };
  let num = 0, den = 0, redistributed = false;
  for (const k of ['sup', 'sub', 'peer', 'sac']) {
    if (!sp[k]) continue;
    if (parts[k] == null) { redistributed = true; continue; }
    num += parts[k] * sp[k]; den += sp[k];
  }
  const II = (den ? num / den : 0) * w[1] / 100;
  const n = { peer: (f3list || []).length, sub: (f4list || []).length };
  if (!f1) return { complete: false, I: null, II, III: null, IV: null, total: null, grade: null, parts, n, redistributed };
  const I = items.reduce((s, it, idx) => s + (Number(f1.i[idx]) || 0) * it.w / 100, 0);
  const III = (pct15(f1.iii) || 0) * w[2] / 100;
  const IV = w[3] ? (pct15(f1.iv) || 0) * w[3] / 100 : 0;
  const total = round1(I + II + III + IV);
  return { complete: true, I, II, III, IV, total, grade: grade(total), parts, n, redistributed };
}

function validateConfig(cfg) {
  const errs = [];
  for (const [k, g] of Object.entries(cfg.groups || {})) {
    if (g.w.reduce((a, b) => a + Number(b), 0) !== 100) errs.push(`ກຸ່ມ ${g.name}: ນ້ຳໜັກ 4 ດ້ານ ລວມຕ້ອງ = 100`);
    if (Object.values(g.split).reduce((a, b) => a + Number(b), 0) !== 100) errs.push(`ກຸ່ມ ${g.name}: ສັດສ່ວນດ້ານ II ລວມຕ້ອງ = 100`);
    if (!g.iii.length) errs.push(`ກຸ່ມ ${g.name}: ຕ້ອງມີລາຍການດ້ານ III`);
    if (g.w[3] > 0 && !g.iv.length) errs.push(`ກຸ່ມ ${g.name}: ຕ້ອງມີລາຍການດ້ານ IV`);
    if (!cfg.questions[g.q2]) errs.push(`ກຸ່ມ ${g.name}: ບໍ່ພົບຊຸດຄຳຖາມ ${g.q2}`);
  }
  for (const q of ['sac', 'peer', 'sub']) if (!(cfg.questions[q] || []).length) errs.push(`ຊຸດຄຳຖາມ ${q} ຫວ່າງ`);
  return errs;
}

if (typeof module !== 'undefined') module.exports = { DEFAULT_CONFIG, GRADES, pct15, round1, grade, gradeText, hasSub, score, validateConfig };


/* ===== server.js ===== */
// ກົດລະບຽບ ແລະ ສິດທັງໝົດ ຢູ່ບ່ອນນີ້. ແລ່ນໄດ້ທັງ Apps Script, browser (ໂໝດທົດລອງ) ແລະ node tests.
// store = {load, save(db, tables), hash, now, uuid, lock(fn)}
const SC = typeof require !== 'undefined' && typeof module !== 'undefined'
  ? require('./scoring.js') : { DEFAULT_CONFIG, score, hasSub, validateConfig };
const TABLES = ['staff', 'rounds', 'kpi', 'peers', 'answers', 'sessions', 'results', 'roles'];
const ROUND_FLOW = { setup: ['eval'], eval: ['setup', 'closed'], closed: ['eval', 'published'], published: ['closed'] };
// ສິດທີ່ Admin ກຳນົດໃຫ້ແຕ່ລະບົດບາດໄດ້. ADMIN ມີທຸກສິດ ແລະ ແກ້ໄຂບໍ່ໄດ້.
const PERMS = ['staff', 'roles', 'round', 'peers', 'config', 'kpiReview', 'kpiFinal', 'progress', 'results'];
const DEFAULT_ROLES = [
  { code: 'ADMIN', name: 'ຜູ້ດູແລລະບົບ (Admin)', perms: PERMS.slice() },
  { code: 'HR', name: 'HR', perms: PERMS.filter(p => p !== 'roles' && p !== 'kpiFinal') },
  { code: 'PRESIDENT', name: 'ປະທານ', perms: ['kpiFinal'] }
];
const clone = o => JSON.parse(JSON.stringify(o));

function permsOf(s, roles) {
  return new Set((s.roles || []).flatMap(c => (roles.find(r => r.code === c) || { perms: [] }).perms));
}
function E(msg) { const e = new Error(msg); e.user = true; return e; }
const NOAUTH = 'ກະລຸນາເຂົ້າລະບົບໃໝ່';
const NOPERM = 'ທ່ານບໍ່ມີສິດເຮັດລາຍການນີ້';

function handle(req, store) {
  try { return store.lock(() => run(req || {}, store)); }
  catch (e) { return { ok: false, err: e.user ? e.message : 'ລະບົບຜິດພາດ: ' + e.message }; }
}

function run(req, store) {
  const db = store.load();
  for (const k of TABLES) db[k] = db[k] || [];
  if (!db.roles.length) db.roles = clone(DEFAULT_ROLES);
  const adm = db.roles.find(r => r.code === 'ADMIN');
  if (adm) adm.perms = PERMS.slice(); else db.roles.unshift(clone(DEFAULT_ROLES[0]));
  const X = ctx(db, db.config || clone(SC.DEFAULT_CONFIG), store);
  if (req.a === 'login') return login(X, req);
  const fn = ACTIONS[req.a];
  if (!fn) throw E('ບໍ່ຮູ້ຈັກຄຳສັ່ງ');
  const u = X.auth(req.t);
  fn(X, u, req);
  if (X.ch.size) store.save(db, [...X.ch]);
  return { ok: true, boot: boot(X, u, req) };
}

function ctx(db, cfg, store) {
  const X = { db, cfg, store, ch: new Set(), now: store.now() };
  X.by = code => db.staff.find(s => s.code === code);
  X.active = () => db.staff.filter(s => s.active !== false);
  X.evaluated = s => !!s && s.active !== false && !!cfg.groups[s.group];
  X.subs = code => X.active().filter(s => s.sup === code);
  // bootstrap: ຖ້າບໍ່ມີໃຜມີສິດ "ກຳນົດສິດ", ຄົນທີ່ມີສິດ "ຈັດການພະນັກງານ" ໄດ້ສິດນັ້ນ (ກັນລັອກຕົນເອງອອກ)
  X.perms = u => {
    const p = permsOf(u, db.roles);
    if (!p.has('roles') && p.has('staff') && !X.active().some(s => permsOf(s, db.roles).has('roles'))) p.add('roles');
    return p;
  };
  X.can = (u, p) => X.perms(u).has(p);
  X.pres = () => X.active().find(s => X.can(s, 'kpiFinal'));
  X.approverOf = e => { if (e.appr) return e.appr; const s = X.by(e.sup); return (s && s.sup) || null; };
  X.openRound = () => db.rounds.find(r => r.status === 'setup' || r.status === 'eval');
  X.round = id => (id && db.rounds.find(r => r.id === id)) || X.openRound() || db.rounds[db.rounds.length - 1] || null;
  X.kpi = (rid, emp) => db.kpi.find(k => k.round === rid && k.emp === emp);
  X.subAns = (rid, form, emp) => db.answers.filter(a => a.round === rid && a.form === form && a.emp === emp && a.status === 'sub');
  X.auth = t => {
    const s = t && db.sessions.find(x => x.t === t && x.exp > X.now);
    const u = s && X.by(s.code);
    if (!u || u.active === false) throw E(NOAUTH);
    return u;
  };
  X.need = cond => { if (!cond) throw E(NOPERM); };
  return X;
}

// ---------- login ----------
function login(X, req) {
  const code = String(req.code || '').trim().toUpperCase();
  const s = X.db.staff.find(x => x.code === code && x.active !== false);
  if (!s || !s.pin) throw E('ລະຫັດ ຫຼື PIN ບໍ່ຖືກ');
  if ((s.lockUntil || 0) > X.now) throw E('ໃສ່ PIN ຜິດຫຼາຍເທື່ອ, ລອງໃໝ່ຫຼັງ 15 ນາທີ');
  if (X.store.hash(String(req.pin || '')) !== s.pin) {
    s.fails = (s.fails || 0) + 1;
    if (s.fails >= 5) { s.lockUntil = X.now + 15 * 60e3; s.fails = 0; }
    X.store.save(X.db, ['staff']);
    throw E('ລະຫັດ ຫຼື PIN ບໍ່ຖືກ');
  }
  s.fails = 0; s.lockUntil = 0;
  X.db.sessions = X.db.sessions.filter(x => x.exp > X.now);
  const t = X.store.uuid();
  X.db.sessions.push({ t, code: s.code, exp: X.now + 30 * 864e5 });
  X.store.save(X.db, ['staff', 'sessions']);
  return { ok: true, token: t, boot: boot(X, s, req) };
}

// ---------- KPI ----------
function kpiFor(X, u, emp, wantSup) {
  const r = X.openRound();
  if (!r) throw E('ບໍ່ມີຮອບປະເມີນທີ່ເປີດຢູ່');
  const e = X.by(emp);
  if (!X.evaluated(e)) throw E('ບໍ່ພົບພະນັກງານທີ່ຖືກປະເມີນ');
  if (wantSup) X.need(e.sup === u.code);
  return { r, e, k: X.kpi(r.id, e.code) };
}
function hist(X, k, u, act, msg) { k.hist = (k.hist || []).concat({ at: X.now, by: u.code, act, msg: msg || '' }); X.ch.add('kpi'); }
function decide(X, u, k, ok, msg, next) {
  if (!ok && !String(msg || '').trim()) throw E('ກະລຸນາຂຽນເຫດຜົນທີ່ສົ່ງກັບ');
  k.status = ok ? next : 'draft';
  hist(X, k, u, ok ? 'ອະນຸມັດ' : 'ສົ່ງກັບ', msg);
}
const afterAppr = X => X.pres() ? 'pres' : 'ok';

function kpiSave(X, u, req) {
  const { r, e, k } = kpiFor(X, u, req.emp, true);
  if (k && k.status !== 'draft') throw E('KPI ນີ້ສົ່ງໄປແລ້ວ, ແກ້ບໍ່ໄດ້');
  const items = req.items;
  if (!Array.isArray(items) || !items.length || items.length > 10) throw E('ຕ້ອງມີຕົວຊີ້ວັດ 1–10 ຂໍ້');
  const clean = items.map(it => {
    const t = String(it.t || '').trim().slice(0, 200), w = Number(it.w);
    if (!t) throw E('ກະລຸນາໃສ່ຊື່ຕົວຊີ້ວັດ');
    if (!(w > 0 && w <= 100)) throw E('ນ້ຳໜັກຕ້ອງຢູ່ລະຫວ່າງ 1–100');
    return { t, target: String(it.target || '').trim().slice(0, 300), w };
  });
  if (k) k.items = clean;
  else X.db.kpi.push({ id: X.store.uuid(), round: r.id, emp: e.code, items: clean, status: 'draft', hist: [] });
  X.ch.add('kpi');
}
function kpiSubmit(X, u, req) {
  const { e, k } = kpiFor(X, u, req.emp, true);
  if (!k || k.status !== 'draft') throw E('ບໍ່ມີ KPI ຮ່າງ ໃຫ້ສົ່ງ');
  const need = X.cfg.groups[e.group].w[0], sum = k.items.reduce((s, it) => s + it.w, 0);
  if (Math.abs(sum - need) > 1e-9) throw E(`ນ້ຳໜັກລວມຕ້ອງ = ${need}% (ດຽວນີ້ ${sum}%)`);
  k.status = 'hr'; hist(X, k, u, 'ສົ່ງໃຫ້ HR ກວດ');
}
function kpiAck(X, u, req) {
  const { e, k } = kpiFor(X, u, u.code, false);
  if (!k || k.status !== 'ack') throw E('ບໍ່ມີ KPI ລໍຖ້າຮັບຮູ້');
  if (!req.ok && !String(req.msg || '').trim()) throw E('ກະລຸນາຂຽນເຫດຜົນທີ່ຂໍສົນທະນາ');
  k.status = req.ok ? (X.approverOf(e) ? 'appr' : afterAppr(X)) : 'draft';
  hist(X, k, u, req.ok ? 'ຮັບຮູ້' : 'ຂໍສົນທະນາ', req.msg);
}
function kpiHr(X, u, req) {
  X.need(X.can(u, 'kpiReview'));
  const { k } = kpiFor(X, u, req.emp, false);
  if (!k || k.status !== 'hr') throw E('KPI ນີ້ບໍ່ໄດ້ລໍຖ້າ HR ກວດ');
  decide(X, u, k, req.ok, req.msg, 'ack');
}
function kpiAppr(X, u, req) {
  const { e, k } = kpiFor(X, u, req.emp, false);
  X.need(X.approverOf(e) === u.code);
  if (!k || k.status !== 'appr') throw E('KPI ນີ້ບໍ່ໄດ້ລໍຖ້າອະນຸມັດ');
  decide(X, u, k, req.ok, req.msg, afterAppr(X));
}
function kpiPres(X, u, req) {
  X.need(X.can(u, 'kpiFinal'));
  for (const emp of req.emps || []) {
    const { k } = kpiFor(X, u, emp, false);
    if (!k || k.status !== 'pres') throw E('KPI ບາງລາຍການບໍ່ໄດ້ລໍຖ້າປະທານ');
    decide(X, u, k, req.ok, req.msg, 'ok');
  }
}
function kpiUnlock(X, u, req) {
  X.need(X.can(u, 'kpiReview'));
  const { r, e, k } = kpiFor(X, u, req.emp, false);
  if (!k || k.status === 'draft') throw E('KPI ນີ້ເປັນຮ່າງຢູ່ແລ້ວ');
  if (X.subAns(r.id, 1, e.code).length) throw E('ຟອມ ① ຂອງຄົນນີ້ສົ່ງແລ້ວ — ຕ້ອງເປີດຄືນຟອມ ① ກ່ອນ');
  k.status = 'draft'; hist(X, k, u, 'HR ປົດລັອກ', req.msg);
}

// ---------- answers ----------
function canEval(X, u, form, e, r) {
  if (form === 1 || form === 2) return e.sup === u.code;
  if (form === 3) return X.db.peers.some(p => p.round === r.id && p.emp === e.code && p.by === u.code);
  if (form === 4) return u.sup === e.code && SC.hasSub(X.cfg, e.group);
  return false;
}
function cleanAns(X, form, e, k, a) {
  const g = X.cfg.groups[e.group], Q = X.cfg.questions;
  const r15 = (arr, n) => {
    if (!Array.isArray(arr) || arr.length !== n || !arr.every(v => Number.isInteger(v) && v >= 1 && v <= 5))
      throw E('ກະລຸນາໃຫ້ຄະແນນຄົບທຸກຂໍ້');
    return arr;
  };
  const txt = v => String(v || '').slice(0, 2000);
  if (form === 1) {
    const i = a.i;
    if (!Array.isArray(i) || i.length !== k.items.length || !i.every(v => typeof v === 'number' && v >= 0 && v <= 100))
      throw E('ກະລຸນາໃສ່ % ບັນລຸ (0–100) ທຸກຕົວຊີ້ວັດ');
    return { i, iii: r15(a.iii, g.iii.length), iv: r15(a.iv || [], g.w[3] ? g.iv.length : 0), str: txt(a.str), imp: txt(a.imp), cmt: txt(a.cmt) };
  }
  if (form === 2) return { q: r15(a.q, Q[g.q2].length), s: r15(a.s, Q.sac.length), note: txt(a.note) };
  return { q: r15(a.q, Q[form === 3 ? 'peer' : 'sub'].length), note: txt(a.note) };
}
function answerSubmit(X, u, req) {
  const r = X.openRound();
  if (!r || r.status !== 'eval') throw E('ຍັງບໍ່ເປີດໃຫ້ປະເມີນ');
  const form = Number(req.form), e = X.by(req.emp);
  if (!X.evaluated(e)) throw E('ບໍ່ພົບຜູ້ຖືກປະເມີນ');
  X.need(canEval(X, u, form, e, r));
  const k = X.kpi(r.id, e.code);
  if (form === 1 && (!k || k.status !== 'ok')) throw E('KPI ຂອງຄົນນີ້ຍັງບໍ່ໄດ້ອະນຸມັດ');
  const ans = cleanAns(X, form, e, k, req.ans || {});
  const prev = X.db.answers.find(a => a.round === r.id && a.form === form && a.emp === e.code && a.by === u.code);
  if (prev && prev.status === 'sub') throw E('ທ່ານສົ່ງຟອມນີ້ແລ້ວ');
  if (prev) Object.assign(prev, { ans, status: 'sub', at: X.now });
  else X.db.answers.push({ id: X.store.uuid(), round: r.id, form, emp: e.code, by: u.code, ans, status: 'sub', at: X.now });
  X.ch.add('answers');
}
function answerReopen(X, u, req) {
  X.need(X.can(u, 'progress'));
  const a = X.db.answers.find(x => x.id === req.id);
  if (!a) throw E('ບໍ່ພົບຟອມ');
  const r = X.db.rounds.find(x => x.id === a.round);
  if (!r || r.status !== 'eval') throw E('ເປີດຄືນໄດ້ສະເພາະຕອນຮອບກຳລັງປະເມີນ');
  a.status = 'open'; X.ch.add('answers');
}

// ---------- results ----------
function result(X, r, e) {
  const k = X.kpi(r.id, e.code);
  const latest = f => { const l = X.subAns(r.id, f, e.code); return l.length ? l.reduce((a, b) => (a.at >= b.at ? a : b)).ans : null; };
  const assigned = new Set(X.db.peers.filter(p => p.round === r.id && p.emp === e.code).map(p => p.by));
  const f3 = X.subAns(r.id, 3, e.code).filter(a => assigned.has(a.by)).map(a => a.ans);
  const f4 = SC.hasSub(X.cfg, e.group) ? X.subAns(r.id, 4, e.code).map(a => a.ans) : [];
  const f1 = k && k.status === 'ok' ? latest(1) : null;
  const sc = SC.score(X.cfg, e.group, k ? k.items : [], f1, latest(2), f3, f4);
  return Object.assign({ emp: e.code, name: e.name, dept: e.dept, group: e.group, round: r.id, items: k ? k.items : [], f1, few: {} }, sc);
}
function mask(res) {
  const m = clone(res);
  for (const k of ['peer', 'sub']) if (m.n[k] === 1) { m.parts[k] = null; m.few[k] = true; }
  return m;
}

// ---------- round / staff / peers / config (HR) ----------
function roundCreate(X, u, req) {
  X.need(X.can(u, 'round'));
  if (X.openRound()) throw E('ຍັງມີຮອບທີ່ເປີດຢູ່ — ປິດກ່ອນຈຶ່ງສ້າງຮອບໃໝ່');
  const name = String(req.name || '').trim().slice(0, 60);
  if (!name) throw E('ກະລຸນາໃສ່ຊື່ຮອບ');
  const prev = X.db.rounds[X.db.rounds.length - 1];
  const r = { id: 'R' + X.now.toString(36), name, status: 'setup', at: X.now };
  X.db.rounds.push(r); X.ch.add('rounds');
  if (req.copyKpi && prev) {
    for (const k of X.db.kpi.filter(k => k.round === prev.id))
      X.db.kpi.push({ id: X.store.uuid(), round: r.id, emp: k.emp, items: clone(k.items), status: 'draft', hist: [] });
    X.ch.add('kpi');
  }
}
function roundStatus(X, u, req) {
  X.need(X.can(u, 'round'));
  const r = X.db.rounds.find(x => x.id === req.id);
  if (!r) throw E('ບໍ່ພົບຮອບ');
  if (!(ROUND_FLOW[r.status] || []).includes(req.status)) throw E('ປ່ຽນສະຖານະແບບນີ້ບໍ່ໄດ້');
  if (r.status === 'closed' && req.status === 'eval' && X.openRound()) throw E('ມີຮອບອື່ນເປີດຢູ່');
  r.status = req.status; X.ch.add('rounds');
  if (req.status === 'closed') {
    const rows = X.active().filter(X.evaluated).map(e => {
      const x = result(X, r, e);
      return { round: r.id, emp: e.code, name: e.name, dept: e.dept, group: e.group, I: x.I, II: x.II, III: x.III, IV: x.IV, total: x.total, grade: x.grade };
    });
    X.db.results = X.db.results.filter(x => x.round !== r.id).concat(rows); X.ch.add('results');
  }
}
function cleanStaff(X, row, old) {
  const code = String(row.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{1,20}$/.test(code)) throw E('ລະຫັດພະນັກງານ ຕ້ອງເປັນຕົວອັກສອນອັງກິດ ຫຼື ຕົວເລກ (ບໍ່ເກີນ 20 ຕົວ)');
  const name = String(row.name || '').trim().slice(0, 100);
  if (!name) throw E(`${code}: ກະລຸນາໃສ່ຊື່`);
  const group = String(row.group || '').trim();
  if (group && !X.cfg.groups[group]) throw E(`${code}: ກຸ່ມ KPI "${group}" ບໍ່ຖືກ`);
  const t = v => String(v || '').trim().slice(0, 100), up = v => t(v).toUpperCase();
  return Object.assign({ pin: '', fails: 0, lockUntil: 0 }, old || {}, {
    code, name, group, dept: t(row.dept), div: t(row.div), pos: t(row.pos), sup: up(row.sup), appr: up(row.appr),
    roles: (Array.isArray(row.roles) ? row.roles : String(row.roles || '').split(/[,\s]+/)).map(x => String(x).toUpperCase()).filter(x => X.db.roles.some(r => r.code === x)),
    active: row.active !== false && row.active !== 'false'
  });
}
function checkStaff(list, roles) {
  const by = new Map(list.map(s => [s.code, s]));
  if (by.size !== list.length) throw E('ມີລະຫັດພະນັກງານຊ້ຳກັນ');
  for (const s of list) {
    for (const f of ['sup', 'appr']) {
      if (!s[f]) continue;
      if (s[f] === s.code) throw E(`${s.code}: ເລືອກຕົນເອງເປັນ${f === 'sup' ? 'ຫົວໜ້າ' : 'ຜູ້ອະນຸມັດ'}ບໍ່ໄດ້`);
      if (!by.has(s[f])) throw E(`${s.code}: ບໍ່ພົບລະຫັດ ${s[f]}`);
    }
    let c = s, n = 0;
    while (c && c.sup) { c = by.get(c.sup); if (c === s || ++n > list.length) throw E(`${s.code}: ສາຍບັງຄັບບັນຊາ ເປັນວົງວຽນ`); }
  }
  if (!list.some(s => s.active !== false && ['roles', 'staff'].some(p => permsOf(s, roles).has(p))))
    throw E('ຕ້ອງມີຢ່າງໜ້ອຍ 1 ຄົນທີ່ໃຊ້ງານຢູ່ ທີ່ມີສິດ Admin ຫຼື HR (ຈັດການພະນັກງານ)');
}
function upsertStaff(X, u, rows) {
  const list = X.db.staff.slice(), canRoles = X.can(u, 'roles'), key = r => (r || []).slice().sort().join(',');
  for (const row of rows) {
    const code = String(row.code || '').trim().toUpperCase();
    const i = list.findIndex(s => s.code === code);
    const s = cleanStaff(X, row, i >= 0 ? list[i] : null);
    if (!canRoles && key(s.roles) !== key(i >= 0 ? list[i].roles : [])) throw E(code + ': ການປ່ຽນບົດບາດ ຕ້ອງມີສິດ "ກຳນົດສິດ"');
    if (i >= 0) list[i] = s; else list.push(s);
  }
  checkStaff(list, X.db.roles);
  X.db.staff = list; X.ch.add('staff');
}
function staffSave(X, u, req) { X.need(X.can(u, 'staff')); upsertStaff(X, u, [req.row || {}]); }
function staffImport(X, u, req) {
  X.need(X.can(u, 'staff'));
  if (!Array.isArray(req.rows) || !req.rows.length) throw E('ບໍ່ມີຂໍ້ມູນ');
  upsertStaff(X, u, req.rows);
}
// req = {code, pin} ຫຼື {list:[{code, pin}]} (ທັງຊຸດ ສຳເລັດ ຫຼື ລົ້ມເຫຼວພ້ອມກັນ)
function setPin(X, u, req) {
  X.need(X.can(u, 'staff'));
  for (const it of req.list || [req]) setOnePin(X, it);
}
function setOnePin(X, req) {
  const s = X.by(String(req.code || '').toUpperCase());
  if (!s) throw E('ບໍ່ພົບພະນັກງານ');
  if (!/^\d{4,6}$/.test(String(req.pin || ''))) throw E('PIN ຕ້ອງເປັນຕົວເລກ 4–6 ຕົວ');
  s.pin = X.store.hash(String(req.pin)); s.fails = 0; s.lockUntil = 0;
  X.db.sessions = X.db.sessions.filter(x => x.code !== s.code);
  X.ch.add('staff'); X.ch.add('sessions');
}
// req = {emp, peers} ຫຼື {list:[{emp, peers}]}
function peerSet(X, u, req) {
  X.need(X.can(u, 'peers'));
  const r = X.openRound();
  if (!r) throw E('ບໍ່ມີຮອບປະເມີນທີ່ເປີດຢູ່');
  for (const it of req.list || [req]) peerSetOne(X, r, it);
}
function peerSetOne(X, r, req) {
  const e = X.by(req.emp);
  if (!X.evaluated(e)) throw E('ບໍ່ພົບຜູ້ຖືກປະເມີນ');
  const peers = [...new Set((req.peers || []).map(String))];
  if (peers.length > 5) throw E('ເລືອກເພື່ອນໄດ້ບໍ່ເກີນ 5 ຄົນ');
  for (const c of peers) {
    const p = X.by(c);
    if (!p || p.active === false) throw E(`ບໍ່ພົບພະນັກງານ ${c}`);
    if (c === e.code) throw E('ເລືອກຕົນເອງເປັນເພື່ອນບໍ່ໄດ້');
    if (c === e.sup) throw E(`${p.name} ເປັນຫົວໜ້າໂດຍກົງ — ເລືອກເປັນເພື່ອນບໍ່ໄດ້`);
    if (p.sup === e.code) throw E(`${p.name} ເປັນລູກນ້ອງໂດຍກົງ — ເລືອກເປັນເພື່ອນບໍ່ໄດ້`);
  }
  X.db.peers = X.db.peers.filter(p => !(p.round === r.id && p.emp === e.code))
    .concat(peers.map(by => ({ round: r.id, emp: e.code, by })));
  X.ch.add('peers');
}
function configSave(X, u, req) {
  X.need(X.can(u, 'config'));
  if (X.db.rounds.some(r => r.status === 'eval')) throw E('ກຳລັງປະເມີນຢູ່ — ແກ້ການຕັ້ງຄ່າບໍ່ໄດ້');
  const n = req.config || {}, cfg = clone(X.cfg), strs = a => (Array.isArray(a) ? a : []).map(s => String(s).trim()).filter(Boolean);
  for (const [k, g] of Object.entries(cfg.groups)) {
    const ng = (n.groups || {})[k]; if (!ng) continue;
    g.w = (ng.w || g.w).map(Number);
    for (const s of ['sup', 'sub', 'peer', 'sac']) g.split[s] = Number((ng.split || g.split)[s]) || 0;
    g.iii = strs(ng.iii); g.iv = strs(ng.iv);
    if (ng.iiName) g.iiName = String(ng.iiName);
  }
  for (const q of Object.keys(cfg.questions)) if (n.questions && n.questions[q]) cfg.questions[q] = strs(n.questions[q]);
  if (n.iTemplate) cfg.iTemplate = strs(n.iTemplate);
  if (n.orgName != null) cfg.orgName = String(n.orgName).trim().slice(0, 120);
  const errs = SC.validateConfig(cfg);
  if (errs.length) throw E(errs.join('\n'));
  X.db.config = cfg; X.cfg = cfg; X.ch.add('config');
}
function roleSave(X, u, req) {
  X.need(X.can(u, 'roles'));
  const r = req.role || {}, code = String(r.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_]{2,20}$/.test(code)) throw E('ລະຫັດບົດບາດ ຕ້ອງເປັນຕົວອັກສອນອັງກິດ ຫຼື ຕົວເລກ 2–20 ຕົວ');
  if (code === 'ADMIN') throw E('ບົດບາດ Admin ມີທຸກສິດສະເໝີ — ແກ້ໄຂບໍ່ໄດ້');
  const name = String(r.name || '').trim().slice(0, 60);
  if (!name) throw E('ກະລຸນາໃສ່ຊື່ບົດບາດ');
  const row = { code, name, perms: [...new Set((r.perms || []).filter(p => PERMS.includes(p)))] };
  const i = X.db.roles.findIndex(x => x.code === code), next = X.db.roles.slice();
  if (i >= 0) next[i] = row; else next.push(row);
  checkStaff(X.db.staff, next);
  X.db.roles = next; X.ch.add('roles');
}
function roleDelete(X, u, req) {
  X.need(X.can(u, 'roles'));
  const code = String(req.code || '').toUpperCase();
  if (code === 'ADMIN') throw E('ລຶບບົດບາດ Admin ບໍ່ໄດ້');
  if (!X.db.roles.some(r => r.code === code)) throw E('ບໍ່ພົບບົດບາດ');
  if (X.db.staff.some(s => (s.roles || []).includes(code))) throw E('ຍັງມີພະນັກງານໃຊ້ບົດບາດນີ້ — ເອົາອອກຈາກພະນັກງານກ່ອນ');
  X.db.roles = X.db.roles.filter(r => r.code !== code); X.ch.add('roles');
}
function logout(X, u, req) { X.db.sessions = X.db.sessions.filter(s => s.t !== req.t); X.ch.add('sessions'); }

// ---------- boot: ທຸກຢ່າງທີ່ຜູ້ໃຊ້ຄົນນີ້ມີສິດເຫັນ ----------
function pub(s, full) {
  const p = { code: s.code, name: s.name, dept: s.dept, div: s.div, pos: s.pos, group: s.group, sup: s.sup };
  if (full) Object.assign(p, { appr: s.appr, roles: s.roles || [], active: s.active !== false, hasPin: !!s.pin });
  return p;
}
function canSeeKpi(X, u, k) {
  const e = X.by(k.emp);
  if (!e) return false;
  return X.can(u, 'kpiReview') || X.can(u, 'results') || (k.emp === u.code && !['draft', 'hr'].includes(k.status)) || e.sup === u.code ||
    (X.approverOf(e) === u.code && ['appr', 'pres', 'ok'].includes(k.status)) ||
    (X.can(u, 'kpiFinal') && ['pres', 'ok'].includes(k.status));
}
function duties(X, u, r) {
  const D = [];
  if (!r || !(r.status === 'setup' || r.status === 'eval')) return D;
  const subs = X.subs(u.code).filter(X.evaluated);
  for (const e of subs) { const k = X.kpi(r.id, e.code); D.push({ kind: 'kpiSet', emp: e.code, status: k ? k.status : 'none', done: !!k && k.status !== 'draft' }); }
  const own = X.kpi(r.id, u.code);
  if (own && own.status === 'ack') D.push({ kind: 'kpiAck', emp: u.code, done: false });
  for (const k of X.db.kpi.filter(k => k.round === r.id)) {
    const e = X.by(k.emp); if (!X.evaluated(e)) continue;
    if (k.status === 'hr' && X.can(u, 'kpiReview')) D.push({ kind: 'kpiHr', emp: e.code, done: false });
    if (k.status === 'appr' && X.approverOf(e) === u.code) D.push({ kind: 'kpiAppr', emp: e.code, done: false });
    if (k.status === 'pres' && X.can(u, 'kpiFinal')) D.push({ kind: 'kpiPres', emp: e.code, done: false });
  }
  if (r.status === 'eval') {
    const mine = (f, emp) => X.db.answers.some(a => a.round === r.id && a.form === f && a.emp === emp && a.by === u.code && a.status === 'sub');
    for (const e of subs) {
      const k = X.kpi(r.id, e.code);
      D.push({ kind: 'f1', emp: e.code, done: mine(1, e.code), blocked: !(k && k.status === 'ok') });
      D.push({ kind: 'f2', emp: e.code, done: mine(2, e.code) });
    }
    for (const p of X.db.peers.filter(p => p.round === r.id && p.by === u.code))
      if (X.evaluated(X.by(p.emp))) D.push({ kind: 'f3', emp: p.emp, done: mine(3, p.emp) });
    const sup = X.by(u.sup);
    if (X.evaluated(sup) && SC.hasSub(X.cfg, sup.group)) D.push({ kind: 'f4', emp: sup.code, done: mine(4, sup.code) });
  }
  return D;
}
function boot(X, u, req) {
  const r = X.round(req.round), P = X.perms(u), full = P.has('staff') || P.has('roles');
  const hr = ['progress', 'peers', 'staff', 'round'].some(p => P.has(p));
  const evals = X.active().filter(X.evaluated);
  let results = [];
  if (r && P.has('results')) results = evals.map(e => result(X, r, e));
  else if (r && r.status === 'published')
    results = evals.filter(e => e.code === u.code || e.sup === u.code).map(e => mask(result(X, r, e)));
  const out = {
    me: Object.assign(pub(u, true), { perms: [...P] }), staff: (full ? X.db.staff : X.active()).map(s => pub(s, full)), config: X.cfg,
    roles: X.db.roles,
    rounds: X.db.rounds, round: r,
    kpi: r ? X.db.kpi.filter(k => k.round === r.id && canSeeKpi(X, u, k)) : [],
    duties: duties(X, u, r),
    answersMine: r ? X.db.answers.filter(a => a.round === r.id && a.by === u.code) : [],
    results, approvers: {}, hr: null
  };
  for (const k of out.kpi) { const e = X.by(k.emp); out.approvers[k.emp] = e ? X.approverOf(e) : null; }
  if (hr && r) {
    out.hr = {
      peers: X.db.peers.filter(p => p.round === r.id),
      answers: !P.has('progress') ? [] : X.db.answers.filter(a => a.round === r.id).map(a => ({ id: a.id, form: a.form, emp: a.emp, by: a.by, status: a.status, at: a.at })),
      progress: evals.map(e => {
        const assigned = X.db.peers.filter(p => p.round === r.id && p.emp === e.code).map(p => p.by);
        const k = X.kpi(r.id, e.code);
        return {
          emp: e.code, kpi: k ? k.status : 'none',
          f1: X.subAns(r.id, 1, e.code).length > 0, f2: X.subAns(r.id, 2, e.code).length > 0,
          f3: { done: X.subAns(r.id, 3, e.code).filter(a => assigned.includes(a.by)).length, of: assigned.length },
          f4: SC.hasSub(X.cfg, e.group) ? { done: X.subAns(r.id, 4, e.code).length, of: X.subs(e.code).length } : null,
          noSup: !X.by(e.sup)
        };
      })
    };
  }
  return out;
}

const ACTIONS = {
  boot: () => { }, logout, kpiSave, kpiSubmit, kpiAck, kpiHr, kpiAppr, kpiPres, kpiUnlock,
  answerSubmit, answerReopen, staffSave, staffImport, setPin, roundCreate, roundStatus, peerSet, configSave, roleSave, roleDelete
};

if (typeof module !== 'undefined') module.exports = { handle };


/* ===== store-gas.js ===== */
// Store ສຳລັບ Apps Script: ແຕ່ລະຕາຕະລາງ = 1 tab. ອ່ານ/ຂຽນ ຕາມລຳດັບຖັນ (ແຖວ 1 = ຫົວຂໍ້ພາສາລາວ ໃຫ້ HR ອ່ານ).
const GS_TABS = {
  staff: ['ພະນັກງານ', ['code', 'name', 'dept', 'div', 'pos', 'group', 'sup', 'appr', 'roles', 'active', 'pin', 'fails', 'lockUntil'],
    ['ລະຫັດ', 'ຊື່ ແລະ ນາມສະກຸນ', 'ພະແນກ', 'ຝ່າຍ', 'ຕຳແໜ່ງ', 'ກຸ່ມ KPI', 'ຫົວໜ້າ (ລະຫັດ)', 'ຜູ້ອະນຸມັດ (ລະຫັດ)', 'ບົດບາດ', 'ໃຊ້ງານ', 'PIN (hash)', 'ຜິດ', 'ລັອກເຖິງ']],
  rounds: ['ຮອບ', ['id', 'name', 'status', 'at'], ['id', 'ຊື່ຮອບ', 'ສະຖານະ', 'ສ້າງເມື່ອ']],
  kpi: ['KPI', ['id', 'round', 'emp', 'items', 'status', 'hist'], ['id', 'ຮອບ', 'ພະນັກງານ', 'ຕົວຊີ້ວັດ', 'ສະຖານະ', 'ປະຫວັດ']],
  peers: ['ເພື່ອນ', ['round', 'emp', 'by'], ['ຮອບ', 'ຜູ້ຖືກປະເມີນ', 'ຜູ້ປະເມີນ']],
  answers: ['ຄຳຕອບ', ['id', 'round', 'form', 'emp', 'by', 'ans', 'status', 'at'], ['id', 'ຮອບ', 'ຟອມ', 'ຜູ້ຖືກປະເມີນ', 'ຜູ້ປະເມີນ', 'ຄຳຕອບ', 'ສະຖານະ', 'ເວລາ']],
  sessions: ['sessions', ['t', 'code', 'exp'], ['token', 'ລະຫັດ', 'ໝົດອາຍຸ']],
  roles: ['ສິດ', ['code', 'name', 'perms'], ['ລະຫັດບົດບາດ', 'ຊື່ບົດບາດ', 'ສິດ']],
  results: ['ຜົນ', ['round', 'emp', 'name', 'dept', 'group', 'I', 'II', 'III', 'IV', 'total', 'grade'],
    ['ຮອບ', 'ລະຫັດ', 'ຊື່', 'ພະແນກ', 'ກຸ່ມ', 'ດ້ານ I', 'ດ້ານ II', 'ດ້ານ III', 'ດ້ານ IV', 'ລວມ %', 'ລະດັບ']]
};
const GS_JSON = ['roles', 'items', 'hist', 'ans', 'perms'];
const GS_NUM = ['fails', 'lockUntil', 'at', 'form', 'exp', 'I', 'II', 'III', 'IV', 'total'];
const GS_CONFIG_TAB = 'ຕັ້ງຄ່າ';

function gsSheet(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }
function gsDecode(key, v) {
  if (GS_JSON.includes(key)) return v === '' ? (key === 'ans' ? {} : []) : JSON.parse(v);
  if (GS_NUM.includes(key)) return v === '' || v == null ? null : Number(v);
  if (key === 'active') return String(v) !== 'false';
  return v == null ? '' : String(v);
}
function gsEncode(key, v) {
  if (GS_JSON.includes(key)) return JSON.stringify(v == null ? [] : v);
  if (v == null) return '';
  return key === 'active' ? String(v !== false) : String(v);
}

function gasStore() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salt = PropertiesService.getScriptProperties().getProperty('KPI_SALT') || '';
  return {
    load() {
      const db = {};
      for (const [t, [name, keys]] of Object.entries(GS_TABS)) {
        const rows = gsSheet(ss, name).getDataRange().getValues().slice(1);
        db[t] = rows.filter(r => r[0] !== '').map(r => {
          const o = {}; keys.forEach((k, i) => { o[k] = gsDecode(k, r[i]); }); return o;
        });
      }
      const c = gsSheet(ss, GS_CONFIG_TAB).getRange(1, 1).getValue();
      db.config = c ? JSON.parse(c) : null;
      return db;
    },
    save(db, tables) {
      for (const t of tables) {
        if (t === 'config') { gsSheet(ss, GS_CONFIG_TAB).getRange(1, 1).setValue(JSON.stringify(db.config)); continue; }
        const [name, keys, heads] = GS_TABS[t], sh = gsSheet(ss, name);
        const values = [heads].concat(db[t].map(o => keys.map(k => gsEncode(k, o[k]))));
        sh.clearContents();
        sh.getRange(1, 1, values.length, keys.length).setNumberFormat('@').setValues(values);
      }
    },
    hash(s) {
      return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + s, Utilities.Charset.UTF_8)
        .map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
    },
    now: () => Date.now(),
    uuid: () => Utilities.getUuid(),
    lock(fn) {
      const l = LockService.getScriptLock();
      l.waitLock(20000);
      try { return fn(); } finally { l.releaseLock(); }
    }
  };
}


/* ===== gas-main.js ===== */
// ຈຸດເຂົ້າຂອງ Apps Script web app
function doPost(e) {
  let out;
  try { out = handle(JSON.parse(e.postData.contents), gasStore()); }
  catch (err) { out = { ok: false, err: 'ຄຳຮ້ອງບໍ່ຖືກຕ້ອງ' }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, app: 'kpi', rev: 'manual-order-1' })).setMimeType(ContentService.MimeType.JSON);
}

// ແລ່ນ 1 ເທື່ອ ຫຼັງວາງໂຄ້ດ: ສ້າງ tabs, salt, ແລະ ບັນຊີ HR ທຳອິດ (PIN ສະແດງໃນ Execution log)
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('KPI_SALT')) props.setProperty('KPI_SALT', Utilities.getUuid());
  const st = gasStore(), db = st.load();
  if (!db.staff.length) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    db.staff.push({ code: 'HR001', name: 'HR (ບັນຊີເລີ່ມຕົ້ນ)', dept: 'ບຸກຄະລາກອນ', div: '', pos: 'HR', group: '', sup: '', appr: '',
      roles: ['HR'], active: true, pin: st.hash(pin), fails: 0, lockUntil: 0 });
    Logger.log('ບັນຊີ HR ທຳອິດ: ລະຫັດ HR001  PIN ' + pin + '  (ປ່ຽນ PIN ຫຼັງເຂົ້າລະບົບ)');
  } else Logger.log('ມີພະນັກງານແລ້ວ ' + db.staff.length + ' ຄົນ — ບໍ່ໄດ້ສ້າງບັນຊີໃໝ່');
  if (!db.rounds.length) db.rounds.push({ id: 'R' + Date.now().toString(36), name: 'ປີ ' + new Date().getFullYear(), status: 'setup', at: Date.now() });
  st.save(db, Object.keys(GS_TABS));
}
