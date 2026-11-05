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
