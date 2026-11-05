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
  iTemplate: ['ໜ້າທີ່ຮັບຜິດຊອບ', 'ໜ້າທີ່ຮັບຜິດຊອບເພີ່ມ (ຖ້າມີ)', 'ຄວາມຮູ້ດ້ານວິຊາສະເພາະ', 'ຄວາມຮູ້ນຳໃຊ້ເຄື່ອງມືເທັກໂນໂລຊີທັນສະໄໝ (AI)']
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
