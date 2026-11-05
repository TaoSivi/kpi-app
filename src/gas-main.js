// ຈຸດເຂົ້າຂອງ Apps Script web app
function doPost(e) {
  let out;
  try { out = handle(JSON.parse(e.postData.contents), gasStore()); }
  catch (err) { out = { ok: false, err: 'ຄຳຮ້ອງບໍ່ຖືກຕ້ອງ' }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, app: 'kpi' })).setMimeType(ContentService.MimeType.JSON);
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
