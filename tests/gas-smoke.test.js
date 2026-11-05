// ໂຫຼດ dist/Code.gs ໃນ vm ພ້ອມ stub ຂອງ Google services, ແລ້ວແລ່ນ setup → login → staffImport → boot
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');

const sheets = {};
function mkSheet(name) {
  let data = [];
  const range = (r, c, nr, nc) => ({
    getValues: () => data.slice(r - 1, r - 1 + nr).map(row => row.slice(c - 1, c - 1 + nc)),
    getValue: () => (data[r - 1] || [])[c - 1] ?? '',
    setValue: v => { while (data.length < r) data.push([]); data[r - 1][c - 1] = v; },
    setNumberFormat() { return this; },
    setValues(v) { v.forEach((row, i) => { data[r - 1 + i] = row.slice(); }); return this; }
  });
  return sheets[name] = {
    getDataRange: () => ({ getValues: () => (data.length ? data.map(r => r.slice()) : [['']]) }),
    getRange: (r, c, nr = 1, nc = 1) => range(r, c, nr, nc),
    clearContents: () => { data = []; },
    _data: () => data
  };
}
const props = {};
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => sheets[n] || null, insertSheet: n => mkSheet(n) }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, getUuid: () => crypto.randomUUID(),
    computeDigest: (alg, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b))
  },
  LockService: { getScriptLock: () => ({ waitLock() { }, releaseLock() { } }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ setMimeType: () => ({ body: s }) }) },
  Logger: { log: m => { ctx._log.push(m); } }, _log: []
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'dist', 'Code.gs'), 'utf8'), ctx);

ctx.setup();
const pin = /PIN (\d{6})/.exec(ctx._log.join('\n'))[1];
const post = req => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(req) } }).body);
assert.equal(JSON.parse(ctx.doGet().body).app, 'kpi');
assert.equal(post({ a: 'login', code: 'HR001', pin: '000000' }).ok, false);
const lg = post({ a: 'login', code: 'hr001', pin });
assert.equal(lg.ok, true, lg.err);
const t = lg.token;
const imp = post({ a: 'staffImport', t, rows: [
  { code: '007', name: 'ທ້າວ ທົດສອບ', dept: 'ບັນຊີ', group: 'SPEC', sup: 'HD9' },
  { code: 'HD9', name: 'ນາງ ຫົວໜ້າ', dept: 'ບັນຊີ', group: 'HEAD_DEPT', sup: '' }] });
assert.equal(imp.ok, true, imp.err);
const b = post({ a: 'boot', t }).boot;
assert.equal(b.staff.length, 3);
assert.equal(b.staff.find(s => s.code === '007').sup, 'HD9');          // leading-zero code kept as text
assert.deepEqual(b.staff.find(s => s.code === 'HR001').roles, ['HR']);
assert.equal(b.staff.find(s => s.code === 'HR001').active, true);
assert.equal(sheets['ພະນັກງານ']._data()[0][0], 'ລະຫັດ');                  // Lao header row
assert.equal(post({ a: 'kpiSave', t, emp: '007', items: [{ t: 'x', w: 75 }] }).ok, false); // HR is not 007's supervisor
assert.equal(post({ a: 'nope', t }).ok, false);
assert.equal(JSON.parse(ctx.doPost({ postData: { contents: '{bad' } }).body).ok, false);
console.log('gas-smoke: all passed');
