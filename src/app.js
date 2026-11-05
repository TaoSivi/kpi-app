// UI (vanilla JS). ທຸກຂໍ້ມູນມາຈາກ boot ທີ່ server ກັ່ນຕອງສິດແລ້ວ — UI ບໍ່ຕັດສິນສິດເອງ.
(() => {
  const LSG = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const LSS = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode */ } };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1d = x => (x == null ? '—' : (Math.round(x * 10) / 10).toFixed(1));
  const p2 = n => String(n).padStart(2, '0');
  const fdate = ms => { if (!ms) return ''; const d = new Date(ms); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };

  const A = { mode: LSG('kpi_mode'), api: LSG('kpi_api'), B: null, store: null, busy: false, roundSel: null, kedit: null, after: null, hrQ: '', hrDept: '', hrTodo: false, pins: null, imp: null };
  const tokKey = () => 'kpi_token_' + A.mode;

  const KPI_ST = {
    none: ['ຍັງບໍ່ໄດ້ຕັ້ງ', 'grey'], draft: ['ຮ່າງ', 'grey'], ack: ['ລໍຖ້າພະນັກງານຮັບຮູ້', 'warn'], hr: ['ລໍຖ້າ HR ກວດ', 'warn'],
    appr: ['ລໍຖ້າຜູ້ອະນຸມັດ', 'warn'], pres: ['ລໍຖ້າປະທານ', 'warn'], ok: ['ອະນຸມັດແລ້ວ', 'ok']
  };
  const KPI_STEPS = [['draft', 'ຫົວໜ້າຕັ້ງ'], ['ack', 'ພະນັກງານຮັບຮູ້'], ['hr', 'HR ກວດ'], ['appr', 'ຜູ້ອະນຸມັດ'], ['pres', 'ປະທານ'], ['ok', 'ອະນຸມັດແລ້ວ']];
  const ROUND_ST = { setup: 'ໄລຍະຕັ້ງ KPI', eval: 'ໄລຍະປະເມີນ', closed: 'ປິດຮອບແລ້ວ', published: 'ປະກາດຜົນແລ້ວ' };
  const RATE = ['ອ່ອນ', 'ຄວນປັບປຸງ', 'ພໍໃຊ້', 'ດີ', 'ດີເລີດ'];
  const BADGE = { 1: '①', 2: '②', 3: '③', 4: '④' };
  const ROLE_T = { ADMIN: 'Admin', HR: 'HR', PRESIDENT: 'ປະທານ' };
  const PERM_T = {
    staff: ['ຈັດການພະນັກງານ ແລະ PIN', 'ເພີ່ມ/ແກ້ລາຍຊື່, ນຳເຂົ້າຈາກ Excel, ຕັ້ງ PIN'],
    roles: ['ກຳນົດສິດ ແລະ ບົດບາດ', 'ສ້າງບົດບາດ, ເລືອກສິດ, ມອບບົດບາດໃຫ້ພະນັກງານ'],
    round: ['ຈັດການຮອບປະເມີນ', 'ສ້າງຮອບ, ເປີດປະເມີນ, ປິດຮອບ, ປະກາດຜົນ'],
    peers: ['ກຳນົດເພື່ອນຮ່ວມງານ', 'ເລືອກຄົນທີ່ຈະປະເມີນຟອມ ③'],
    config: ['ຕັ້ງຄ່ານ້ຳໜັກ ແລະ ຄຳຖາມ', 'ແກ້ນ້ຳໜັກ 4 ດ້ານ ແລະ ຄຳຖາມຂອງຟອມ'],
    kpiReview: ['ກວດ KPI (ຂັ້ນ HR)', 'ຜ່ານ ຫຼື ສົ່ງກັບ KPI, ປົດລັອກ KPI'],
    kpiFinal: ['ອະນຸມັດ KPI ສຸດທ້າຍ', 'ຂັ້ນປະທານ — ອະນຸມັດທັງໝົດໄດ້ດ້ວຍປຸ່ມດຽວ'],
    progress: ['ເບິ່ງຄວາມຄືບໜ້າ', 'ເຫັນວ່າໃຜກອກຟອມໃດແລ້ວ, ເປີດຟອມຄືນໃຫ້ແກ້'],
    results: ['ເບິ່ງຜົນທຸກຄົນ', 'ເບິ່ງຄະແນນ ແລະ ດາວໂຫຼດຜົນຂອງທຸກຄົນ']
  };
  const ICONS = {
    list: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6 6 0 0 0-4-5.6"/>',
    pulse: '<path d="M22 12h-4l-3 8-6-16-3 8H2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
    down: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
  };
  // ຮູບປະກອບເມືອງ ໃນແຖບຂ້າງ (ຕົກແຕ່ງເທົ່ານັ້ນ)
  const CITY_SVG = `<svg class="city" viewBox="0 0 312 330" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#58c4d4"/><stop offset="1" stop-color="#1b7a8c"/></linearGradient>
    <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7d96a"/><stop offset="1" stop-color="#4f9a55"/></linearGradient>
    <linearGradient id="cg3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fdad6"/><stop offset="1" stop-color="#2f9aa8"/></linearGradient>
    <linearGradient id="cw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#31a58f"/><stop offset="1" stop-color="#0d5a58"/></linearGradient>
    <g id="cityg"><path d="M-10 168 L58 148 L58 232 L-10 232Z" fill="#3a9a74"/><path d="M-10 190h68M-10 208h68" stroke="#7fd0a0" stroke-opacity=".5" stroke-width="3"/>
      <rect x="68" y="126" width="46" height="106" fill="url(#cg1)"/><path d="M76 138h30M76 152h30M76 166h30M76 180h30M76 194h30M76 208h30" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>
      <rect x="120" y="66" width="30" height="166" fill="url(#cg2)"/><path d="M127 80v140M135 80v140M143 80v140" stroke="#fff" stroke-opacity=".18" stroke-width="1.5"/>
      <path d="M158 232V150L180 88 202 150V232Z" fill="url(#cg3)"/><path d="M180 100v132" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>
      <rect x="208" y="146" width="36" height="86" fill="url(#cg1)"/><path d="M214 158h24M214 172h24M214 186h24M214 200h24" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>
      <rect x="248" y="178" width="30" height="54" fill="#2c8f7d"/></g>
    <clipPath id="cwc"><rect x="0" y="232" width="312" height="120"/></clipPath></defs>
    <use href="#cityg"/><rect x="0" y="232" width="312" height="100" fill="url(#cw)"/><g clip-path="url(#cwc)"><use href="#cityg" transform="translate(0 464) scale(1 -1)" opacity=".26"/></g>
    <g fill="#1f6b4f"><path d="M262 232l12-56 12 56z"/><path d="M280 232l10-44 10 44z"/><path d="M246 232l9-38 9 38z"/><path d="M296 232l9-36 9 36z"/></g>
    <path d="M0 330C6 286 34 262 74 264 46 278 30 300 28 330Z" fill="#1b6650"/><path d="M0 330C14 300 24 290 46 286 30 304 26 318 26 330Z" fill="#2c8a68"/>
    <path d="M312 330C306 296 288 276 262 274 280 290 290 306 290 330Z" fill="#1b6650"/></svg>`;
  const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  // ຕົວອັກສອນທຳອິດຂອງຊື່: ຂ້າມຄຳນຳໜ້າ ແລະ ສະຣະນຳໜ້າ (ເ ແ ໂ ໃ ໄ) ເພື່ອໃຫ້ໄດ້ພະຍັນຊະນະ
  const initial = name => Array.from(String(name || '?').replace(/^(ທ່ານ ນາງ|ທ່ານ|ນາງ|ທ້າວ)\s+/, '').trim().replace(/^[ເແໂໃໄ]+/, ''))[0] || '?';
  const TICK_H = [55, 80, 45, 90, 70, 100, 60, 85, 50, 95, 65, 75, 88, 58];
  const ticks = frac => `<div class="ticks" aria-hidden="true">${TICK_H.map((h, i) => `<i class="${i < Math.round(frac * TICK_H.length) ? 'on' : ''}" style="height:${h}%"></i>`).join('')}</div>`;
  const stat = (label, icon, val, sub, frac) => `<div class="stat"><div class="top"><span>${label}</span><span class="ico">${ic(icon)}</span></div>
    <div class="val">${val}</div><div class="sub">${sub}</div>${frac == null ? '' : ticks(frac)}</div>`;

  const S = code => A.B.staff.find(s => s.code === code);
  const nm = code => { const s = code && S(code); return s ? s.name : (code || '—'); };
  const G = code => A.B.config.groups[code];
  const me = () => A.B.me;
  const can = p => (me().perms || []).includes(p);
  const roleName = c => ((A.B && A.B.roles || []).find(r => r.code === c) || {}).name || ROLE_T[c] || c;
  const kpiOf = emp => A.B.kpi.find(k => k.emp === emp);
  const chip = (t, c) => `<span class="chip ${c || ''}">${esc(t)}</span>`;
  const kchip = st => chip(...(KPI_ST[st] || KPI_ST.none));
  const openRound = () => A.B.round && (A.B.round.status === 'setup' || A.B.round.status === 'eval');
  const f2Title = g => 'ປະເມີນ' + (g ? g.iiName : 'ພາວະຜູ້ນຳ');

  // ---------- plumbing ----------
  let toastT;
  function toast(msg, kind) {
    const t = $('#toast'); t.textContent = msg; t.className = 'show ' + (kind || '');
    clearTimeout(toastT); toastT = setTimeout(() => { t.className = ''; }, kind === 'err' ? 5000 : 2500);
  }
  async function call(a, extra, opt) {
    if (A.busy) return { ok: false, busy: true };          // ກັນກົດຊ້ຳ ຕອນເນັດຊ້າ
    A.busy = true; $('#busy').hidden = false;
    const req = Object.assign({ a, t: LSG(tokKey()), round: A.roundSel }, extra || {});
    let r;
    try {
      if (A.mode === 'demo') r = handle(JSON.parse(JSON.stringify(req)), A.store);
      else {
        const res = await fetch(A.api, { method: 'POST', body: JSON.stringify(req), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        r = await res.json();
      }
    } catch (e) { r = { ok: false, err: 'ເຊື່ອມຕໍ່ບໍ່ໄດ້ — ກວດອິນເຕີເນັດ ແລ້ວລອງໃໝ່' }; }
    A.busy = false; $('#busy').hidden = true;
    if (r.ok) { if (r.token) LSS(tokKey(), r.token); if (r.boot) A.B = r.boot; }
    else if (r.err === 'ກະລຸນາເຂົ້າລະບົບໃໝ່') { LSS(tokKey(), null); A.B = null; }
    if (!r.ok) toast(r.err, 'err');
    if (!(opt && opt.noRender)) render();
    return r;
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  // ---------- chrome ----------
  function sideHtml(B) {
    const m = B.me, r = B.round, org = String(B.config.orgName || '').trim();
    const roles = (m.roles || []).map(c => `<span class="gchip">${esc(roleName(c))}</span>`).join('');
    return `<div class="side-in"><div class="side-top">${r ? `<span class="gchip">${ic('cal')} ${esc(r.name)}</span>` : ''}</div>
      <div class="avatar xl" aria-hidden="true">${esc(initial(m.name))}</div>
      <div class="side-name">${esc(m.name)}</div><div class="side-pos">${esc(m.pos || '')}${m.dept ? ' · ' + esc(m.dept) : ''}</div>
      ${roles ? `<div class="side-roles">${roles}</div>` : ''}
      <button class="side-btn" data-act="logout">${ic('logout')} ອອກຈາກລະບົບ</button>
      ${r ? `<div class="side-lab">ຮອບປະເມີນ:</div><div class="side-box"><div class="sb-a"><small>ຮອບ</small><b>${esc(r.name)}</b></div><div class="sb-b"><small>ສະຖານະ</small><b>${ROUND_ST[r.status]}</b></div></div>` : ''}
      <div class="side-org">${esc(org || 'ປະເມີນ KPI')}</div><div class="side-sub">ລະບົບປະເມີນຜົນການປະຕິບັດວຽກ (KPI)</div></div>${CITY_SVG}`;
  }
  function chrome() {
    const B = A.B, top = $('#top'), nav = $('#nav'), bar = $('#demo-bar'), side = $('#side');
    top.hidden = nav.hidden = side.hidden = false;
    document.body.classList.add('app');
    const r = B.round;
    top.innerHTML = `<div class="bar-in"><a class="brand" href="#home"><span class="mark">${ic('target')}</span>ປະເມີນ KPI</a><span class="sp"></span>
      ${r ? `<span class="chip teal rchip">${ic('cal')} ${esc(r.name)} · ${ROUND_ST[r.status]}</span>` : ''}
      <div class="who"><div class="nm"><b>${esc(B.me.name)}</b><span>${esc(B.me.pos || '')}</span></div><div class="avatar" aria-hidden="true">${esc(initial(B.me.name))}</div></div>
      <button class="icon-btn" data-act="logout" aria-label="ອອກຈາກລະບົບ" title="ອອກຈາກລະບົບ">${ic('logout')}</button></div>`;
    const [cur] = (location.hash.slice(1) || 'home').split('/');
    const tabs = [['home', 'list', 'ວຽກຂອງຂ້ອຍ'], ['res', 'chart', 'ຜົນປະເມີນ']].concat(hrTabs().length ? [['hr', 'gear', 'HR']] : []);
    nav.innerHTML = `<a class="brand side-only" href="#home" aria-label="ປະເມີນ KPI" title="ປະເມີນ KPI"><span class="mark">${ic('target')}</span></a>` +
      tabs.map(([h, i, t]) => `<a href="#${h}" class="${cur === h || (h === 'home' && ['kpi', 'form', 'pres'].includes(cur)) ? 'on' : ''}" ${cur === h ? 'aria-current="page"' : ''}>${ic(i)}<span>${t}</span></a>`).join('');
    side.innerHTML = sideHtml(B);
    bar.hidden = A.mode !== 'demo';
    if (A.mode === 'demo') {
      const opts = A.store.load().staff.map(s => `<option value="${esc(s.code)}" ${s.code === B.me.code ? 'selected' : ''}>${esc(s.name)} — ${esc(s.pos)}</option>`).join('');
      bar.innerHTML = `<div class="wrap"><b>ໂໝດທົດລອງ</b><span>ເປັນ:</span><select id="demo-who" aria-label="ສະຫຼັບຜູ້ໃຊ້">${opts}</select>
        <button class="link" data-act="demoReset">ລ້າງຂໍ້ມູນທົດລອງ</button></div>`;
    }
  }
  function hideChrome() { $('#top').hidden = $('#nav').hidden = $('#side').hidden = $('#demo-bar').hidden = true; document.body.classList.remove('app'); }

  // ---------- setup / login ----------
  function vSetup() {
    hideChrome();
    return `<h1 style="margin-top:24px">ລະບົບປະເມີນ KPI ພະນັກງານ</h1>
    <div class="card"><h2>ເຊື່ອມຕໍ່ລະບົບຂອງບໍລິສັດ</h2><p class="muted">ວາງລິ້ງ Apps Script ທີ່ HR ສົ່ງໃຫ້</p>
      <label class="f"><span>ລິ້ງ</span><input id="api-url" class="in" inputmode="url" placeholder="https://script.google.com/macros/s/…/exec"></label>
      <button class="btn pri block" data-act="setApi">ເຊື່ອມຕໍ່</button></div>
    <div class="card"><h2>ລອງໃຊ້ກ່ອນ</h2><p class="muted">ໂໝດທົດລອງ ໃຊ້ຂໍ້ມູນສົມມຸດ 13 ຄົນ, ເກັບໄວ້ໃນເຄື່ອງນີ້ເທົ່ານັ້ນ</p>
      <button class="btn block" data-act="demo">ເປີດໂໝດທົດລອງ</button></div>`;
  }
  function vLogin() {
    hideChrome();
    let demo = '';
    if (A.mode === 'demo') {
      demo = `<div class="card"><h3>ໂໝດທົດລອງ — ກົດເລືອກຄົນເພື່ອເຂົ້າ (PIN 1234)</h3>` +
        A.store.load().staff.map(s => `<div class="list-row" data-act="demoLogin" data-code="${esc(s.code)}"><div class="grow"><b>${esc(s.name)}</b>
          <div class="muted">${esc(s.pos)} · ${esc(s.dept)}${(s.roles || []).map(r => ' · ' + (ROLE_T[r] || r)).join('')}</div></div><span class="chip">${esc(s.code)}</span></div>`).join('') + `</div>`;
    }
    return `<h1 style="margin-top:24px">ເຂົ້າລະບົບ</h1>
    <form class="card" data-submit="login">
      <label class="f"><span>ລະຫັດພະນັກງານ</span><input id="lg-code" class="in" autocomplete="username" autocapitalize="characters" required></label>
      <label class="f"><span>PIN</span><input id="lg-pin" class="in" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" required></label>
      <button class="btn pri block">ເຂົ້າລະບົບ</button>
      <p class="muted" style="margin-top:8px">ລືມ PIN? ຕິດຕໍ່ HR</p></form>
    ${demo}<button class="link" data-act="resetMode">ປ່ຽນການເຊື່ອມຕໍ່</button>`;
  }

  // ---------- home ----------
  function dutyInfo(d) {
    const e = S(d.emp) || { name: d.emp, pos: '' }, g = G(e.group), who = `${esc(e.name)}${e.pos ? ' · ' + esc(e.pos) : ''}`;
    switch (d.kind) {
      case 'kpiSet': return { b: 'KPI', t: 'ຕັ້ງ KPI ໃຫ້ລູກນ້ອງ', sub: who, href: '#kpi/' + d.emp, chip: kchip(d.status) };
      case 'kpiAck': return { b: 'KPI', t: 'ກວດ ແລະ ຮັບຮູ້ KPI ຂອງທ່ານ', sub: 'ຫົວໜ້າສົ່ງ KPI ມາໃຫ້ທ່ານແລ້ວ', href: '#kpi/' + d.emp };
      case 'kpiHr': return { b: 'KPI', t: 'HR ກວດ KPI', sub: who, href: '#kpi/' + d.emp };
      case 'kpiAppr': return { b: 'KPI', t: 'ອະນຸມັດ KPI', sub: who, href: '#kpi/' + d.emp };
      case 'f1': return { b: BADGE[1], t: 'ປະເມີນລວມ (ຟອມ ①)', sub: who, href: '#form/1/' + d.emp, blocked: d.blocked };
      case 'f2': return { b: BADGE[2], t: f2Title(g) + ' (ຟອມ ②)', sub: who, href: '#form/2/' + d.emp };
      case 'f3': return { b: BADGE[3], t: 'ປະເມີນເພື່ອນຮ່ວມງານ (ຟອມ ③)', sub: who, href: '#form/3/' + d.emp };
      case 'f4': return { b: BADGE[4], t: 'ປະເມີນຫົວໜ້າຂອງທ່ານ (ຟອມ ④)', sub: who, href: '#form/4/' + d.emp };
    }
    return { b: '?', t: d.kind, sub: who, href: '#home' };
  }
  const KIND_IC = { kpiSet: 'file', kpiAck: 'file', kpiHr: 'shield', kpiAppr: 'shield', kpiPres: 'shield', f1: 'target', f2: 'pulse', f3: 'users', f4: 'users' };
  function dutyRow(d) {
    const x = dutyInfo(d), icn = ic(KIND_IC[d.kind] || 'list');
    if (x.blocked) return `<div class="srow"><span class="sico">${icn}</span><div class="grow"><div class="t">${x.t}</div><div class="muted small">${x.sub}</div>
      <div class="muted small">ລໍຖ້າ KPI ຂອງຄົນນີ້ອະນຸມັດກ່ອນ</div></div>${chip('ຍັງເຮັດບໍ່ໄດ້', 'grey')}</div>`;
    return `<a class="srow${d.done ? ' done' : ''}" href="${x.href}"><span class="sico">${d.done ? ic('check') : icn}</span><div class="grow"><div class="t">${x.t}</div>
      <div class="muted small">${x.sub}</div></div>${d.done ? chip('ເຮັດແລ້ວ', 'ok') : (x.chip || '<span class="pill-btn">ເລີ່ມ</span>')}</a>`;
  }
  const STAGES = [['ຕັ້ງ ແລະ ອະນຸມັດ KPI', ['kpiSet', 'kpiAck', 'kpiHr', 'kpiAppr', 'kpiPres']], ['ປະເມີນລູກນ້ອງ ①②', ['f1', 'f2']], ['ປະເມີນເພື່ອນ/ຫົວໜ້າ ③④', ['f3', 'f4']]];
  const pctOf = (a, b) => (b ? Math.round(a / b * 100) : 0);
  function vHome() {
    const B = A.B, r = B.round;
    if (!r) return `<div class="card"><h2>ຍັງບໍ່ມີຮອບປະເມີນ</h2><p>${can('round') ? '<a href="#hr/round">ສ້າງຮອບປະເມີນ</a>' : 'ລໍຖ້າ HR ເປີດຮອບປະເມີນ'}</p></div>`;
    const pend = B.duties.filter(d => !d.done && d.kind !== 'kpiPres'), done = B.duties.filter(d => d.done), pres = B.duties.filter(d => d.kind === 'kpiPres');
    const G3 = STAGES.map(([, kinds]) => {
      const L = B.duties.filter(d => kinds.includes(d.kind)), dn = L.filter(d => d.done).length;
      return { total: L.length, done: dn, left: L.length - dn, pct: pctOf(dn, L.length) };
    });
    const overall = pctOf(done.length, B.duties.length), formsPct = pctOf(G3[1].done + G3[2].done, G3[1].total + G3[2].total);
    const roundPct = { setup: 25, eval: 60, closed: 85, published: 100 }[r.status] || 0, C = 2 * Math.PI * 50;
    let h = `<h1>ສະບາຍດີ ${esc(B.me.name)}</h1><p class="muted">ມາເບິ່ງຄວາມຄືບໜ້າຂອງທ່ານ · ${esc(r.name)} · ${ROUND_ST[r.status]}</p>`;
    if (r.id !== (B.rounds.find(x => x.status === 'setup' || x.status === 'eval') || {}).id && A.roundSel)
      h += `<div class="alert info">ກຳລັງເບິ່ງຮອບເກົ່າ <button class="link" data-act="roundSel" data-id="">ກັບໄປຮອບປັດຈຸບັນ</button></div>`;
    h += `<div class="dash"><div class="stages">${STAGES.map((st, i) => { const g = G3[i]; return `<div class="stage s${i + 1}"><div class="arrow"><small>ຄ້າງ</small><b>${g.left}</b></div>
        <div><div class="lab">${st[0]}</div><div class="pct"><span class="mbar"><i style="width:${g.pct}%"></i></span><span class="pchip">${g.pct}%</span></div></div>
        <div class="metrics"><div><span>ເຮັດແລ້ວ</span><b>${g.done}/${g.total}</b></div><div><span>ຄ້າງ</span><b>${g.left}</b></div></div></div>`; }).join('')}</div>
      <div class="card donutcard"><h3 class="dc-title">ຄວາມຄືບໜ້າ ${esc(r.name)}</h3>
        <div class="donut" role="img" aria-label="ເຮັດແລ້ວ ${overall}%"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="dt" cx="60" cy="60" r="50"/>
          <circle class="dp" cx="60" cy="60" r="50" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - overall / 100)).toFixed(1)}"/></svg>
          <div class="dc"><b>${overall}%</b><small>ເຮັດແລ້ວ</small></div></div>
        ${[['ຕັ້ງ ແລະ ອະນຸມັດ KPI', G3[0].pct, 'b1'], ['ຟອມປະເມີນ', formsPct, 'b2'], ['ໄລຍະຂອງຮອບ', roundPct, 'b3']].map(([t, v, c]) =>
          `<div class="pr"><div class="row between"><span>${t}</span><b>${v}%</b></div><div class="pbar ${c}"><i style="width:${v}%"></i></div></div>`).join('')}</div></div>`;
    const order = d => (dutyInfo(d).blocked ? 1 : 0);
    const rows = (pres.length ? `<a class="srow" href="#pres"><span class="sico">${ic('shield')}</span><div class="grow"><div class="t">ອະນຸມັດ KPI ສຸດທ້າຍ</div>
      <div class="muted small">${pres.length} ຄົນ ລໍຖ້າປະທານອະນຸມັດ</div></div><span class="pill-btn">ເປີດ</span></a>` : '') + pend.slice().sort((a, b) => order(a) - order(b)).map(dutyRow).join('');
    const msg = { setup: 'ຕອນນີ້ເປັນໄລຍະຕັ້ງ KPI. ເມື່ອຫົວໜ້າສົ່ງ KPI ມາ ຈະມີວຽກສະແດງຢູ່ນີ້.', eval: 'ທ່ານປະເມີນຄົບທຸກຟອມແລ້ວ. ຂອບໃຈ!',
      closed: 'ຮອບນີ້ປິດແລ້ວ. ລໍຖ້າ HR ປະກາດຜົນ.', published: 'ຜົນປະເມີນປະກາດແລ້ວ — ເບິ່ງໃນແຖບ "ຜົນປະເມີນ".' }[r.status];
    const own = kpiOf(B.me.code), evaluated = !!G(B.me.group), myRes = B.results.some(x => x.emp === B.me.code) && !can('results');
    const mine = evaluated || own || myRes ? `<div class="card mykpi"><div class="card-h">${ic('file')}<h3>KPI ຂອງຂ້ອຍ</h3>${own ? kchip(own.status) : ''}</div>
      ${own ? `${steps(own.status)}<p class="muted">${own.items.length} ຕົວຊີ້ວັດ</p><a class="pill-btn" href="#kpi/${esc(B.me.code)}">ເບິ່ງ KPI</a>`
        : `<p class="muted">ຫົວໜ້າ (${esc(nm(B.me.sup))}) ຍັງບໍ່ໄດ້ສົ່ງ KPI ມາ</p>`}
      ${myRes ? `<p style="margin-top:12px"><a class="pill-btn" href="#res/${esc(B.me.code)}">ເບິ່ງຜົນປະເມີນຂອງຂ້ອຍ</a></p>` : ''}</div>` : '';
    h += `<div class="dash2${mine ? '' : ' one'}">${mine}<div class="card sched"><div class="card-h">${ic('list')}<h3>ວຽກທີ່ຕ້ອງເຮັດ</h3><span class="muted small">${pend.length + pres.length} ລາຍການ</span></div>
      ${rows || `<p class="muted">${msg}</p>`}
      ${done.length ? `<details><summary class="pill-sum">ເບິ່ງວຽກທີ່ເຮັດແລ້ວ (${done.length})</summary>${done.map(dutyRow).join('')}</details>` : ''}</div></div>`;
    return h;
  }

  // ---------- KPI ----------
  function steps(st) {
    const i = KPI_STEPS.findIndex(s => s[0] === (st === 'none' ? 'draft' : st));
    return `<div class="chev" role="list" aria-label="ຂັ້ນຕອນ KPI">${KPI_STEPS.map((s, j) => `<span role="listitem" class="${j < i || st === 'ok' ? 'done' : j === i ? 'cur' : ''}" ${j === i ? 'aria-current="step"' : ''}>${s[1]}</span>`).join('')}</div>`;
  }
  function kpiTable(items, f1i) {
    return `<div class="scroll"><table class="tbl"><thead><tr><th>ຕົວຊີ້ວັດ</th><th>ເປົ້າໝາຍ</th><th class="n">ນ້ຳໜັກ</th>${f1i ? '<th class="n">ບັນລຸ</th>' : ''}</tr></thead><tbody>
      ${items.map((it, i) => `<tr><td>${esc(it.t)}</td><td>${esc(it.target)}</td><td class="n">${it.w}%</td>${f1i ? `<td class="n">${f1i[i]}%</td>` : ''}</tr>`).join('')}
      <tr><td colspan="2"><b>ລວມ</b></td><td class="n"><b>${items.reduce((s, it) => s + Number(it.w), 0)}%</b></td>${f1i ? '<td></td>' : ''}</tr></tbody></table></div>`;
  }
  function vKpi(emp) {
    const e = S(emp);
    if (!e) return notFound();
    const g = G(e.group), k = kpiOf(emp), st = k ? k.status : 'none', m = me();
    const canEdit = e.sup === m.code && openRound() && (st === 'none' || st === 'draft');
    let h = `<a class="back" href="#home">← ກັບຄືນ</a><h1>KPI ດ້ານ I — ${esc(e.name)}</h1>
      <p class="muted">${esc(e.pos)} · ${esc(e.dept)} · ກຸ່ມ ${esc(g ? g.name : '-')} · ນ້ຳໜັກດ້ານ I = ${g ? g.w[0] : '?'}%</p>${steps(st)}`;
    const last = k && (k.hist || []).slice(-1)[0];
    if (st === 'draft' && last && (last.act === 'ສົ່ງກັບ' || last.act === 'ຂໍສົນທະນາ'))
      h += `<div class="alert bad"><b>${esc(nm(last.by))} ${esc(last.act)}:</b> ${esc(last.msg)}</div>`;
    if (canEdit) {
      if (!A.kedit || A.kedit.emp !== emp) {
        const items = k && k.items.length ? k.items.map(x => Object.assign({}, x)) : A.B.config.iTemplate.map(t => ({ t, target: '', w: '' }));
        A.kedit = { emp, items };
      }
      h += `<div class="alert info">ຂຽນຕົວຊີ້ວັດທີ່ວັດໄດ້ ແລະ ນ້ຳໜັກ %. ນ້ຳໜັກລວມຕ້ອງເທົ່າກັບ <b>${g.w[0]}%</b>.</div>`;
      h += A.kedit.items.map((it, i) => `<div class="item kitem"><span class="qn">${i + 1}</span><div class="kfields">
          <label class="f"><span>ຕົວຊີ້ວັດ</span><textarea class="in" rows="2" data-kf="t" data-i="${i}" maxlength="200">${esc(it.t)}</textarea></label>
          <label class="f"><span>ເປົ້າໝາຍ / ວິທີວັດ</span><input class="in" data-kf="target" data-i="${i}" value="${esc(it.target)}" maxlength="300"></label>
          <label class="f"><span>ນ້ຳໜັກ %</span><input class="in" type="number" inputmode="decimal" min="1" max="100" data-kf="w" data-i="${i}" value="${esc(it.w)}"></label></div>
        <button class="icon-btn" data-act="kpiDel" data-i="${i}" aria-label="ລຶບຕົວຊີ້ວັດ ${i + 1}" title="ລຶບ">${ic('trash')}</button></div>`).join('');
      h += `<button class="btn block" data-act="kpiAdd" style="margin-bottom:16px" ${A.kedit.items.length >= 10 ? 'disabled' : ''}>+ ເພີ່ມຕົວຊີ້ວັດ</button>
        <div class="fbar kbar no-print"><div id="wsum" class="wsum"></div><div class="kbtns"><button class="btn" data-act="kpiSave">ບັນທຶກຮ່າງ</button><button class="btn pri" data-act="kpiSubmit">ສົ່ງໃຫ້ ${esc(e.name)} ຮັບຮູ້</button></div></div>`;
      A.after = updWsum;
    } else if (!k) {
      h += `<div class="card"><p>ຍັງບໍ່ໄດ້ຕັ້ງ KPI. ຫົວໜ້າ (${esc(nm(e.sup))}) ເປັນຜູ້ຕັ້ງ.</p></div>`;
    } else {
      h += `<div class="card">${kpiTable(k.items)}</div>`;
      h += kpiActions(e, k);
    }
    if (k && (k.hist || []).length) h += `<details><summary>ປະຫວັດ (${k.hist.length})</summary><div class="card">${k.hist.slice().reverse().map(x =>
      `<div class="small"><b>${esc(nm(x.by))}</b> — ${esc(x.act)}${x.msg ? ': ' + esc(x.msg) : ''} <span class="muted">${fdate(x.at)}</span></div>`).join('')}</div></details>`;
    return h;
  }
  function kpiActions(e, k) {
    const m = me(), st = k.status;
    const panel = (title, a, okT, noT) => `<div class="card"><h3>${title}</h3>
      <label class="f"><span>ຄຳເຫັນ (ຕ້ອງຂຽນ ຖ້າສົ່ງກັບ)</span><textarea id="kmsg" class="in" maxlength="500"></textarea></label>
      <div class="btns"><button class="btn bad" data-act="kpiDecide" data-a="${a}" data-emp="${esc(e.code)}" data-ok="0">${noT}</button>
      <button class="btn ok" data-act="kpiDecide" data-a="${a}" data-emp="${esc(e.code)}" data-ok="1">${okT}</button></div></div>`;
    if (e.code === m.code && st === 'ack') return panel('ທ່ານເຫັນດີກັບ KPI ນີ້ບໍ?', 'kpiAck', 'ຮັບຮູ້ KPI', 'ຂໍສົນທະນາກັບຫົວໜ້າ');
    if (can('kpiReview') && st === 'hr') return panel('HR ກວດ KPI', 'kpiHr', 'ຜ່ານການກວດ', 'ສົ່ງກັບໃຫ້ແກ້');
    if (A.B.approvers[e.code] === m.code && st === 'appr') return panel('ອະນຸມັດ KPI', 'kpiAppr', 'ອະນຸມັດ', 'ສົ່ງກັບໃຫ້ແກ້');
    if (can('kpiFinal') && st === 'pres') return panel('ອະນຸມັດສຸດທ້າຍ', 'kpiPres', 'ອະນຸມັດ', 'ສົ່ງກັບໃຫ້ແກ້');
    if (can('kpiReview') && st === 'ok' && openRound()) return `<button class="btn block" data-act="kpiUnlock" data-emp="${esc(e.code)}">ປົດລັອກ KPI ໃຫ້ແກ້ໄຂ (HR)</button>`;
    if (st !== 'ok') return `<p class="muted">ສະຖານະ: ${KPI_ST[st][0]}${st === 'appr' ? ' (' + esc(nm(A.B.approvers[e.code])) + ')' : ''}</p>`;
    return '';
  }
  function updWsum() {
    const el = $('#wsum'); if (!el || !A.kedit) return;
    const e = S(A.kedit.emp), need = G(e.group).w[0];
    const sum = A.kedit.items.reduce((s, it) => s + (Number(it.w) || 0), 0);
    el.className = 'wsum ' + (sum === need ? 'good' : 'bad');
    el.textContent = `ນ້ຳໜັກລວມ: ${sum} / ${need}%` + (sum === need ? ' ✓ ຄົບ' : sum > need ? ' — ເກີນ' : ' — ຍັງຂາດ ' + (need - sum) + '%');
  }
  function vPres() {
    const list = A.B.kpi.filter(k => k.status === 'pres');
    let h = `<a class="back" href="#home">← ກັບຄືນ</a><h1>ອະນຸມັດ KPI ສຸດທ້າຍ</h1>`;
    if (!list.length) return h + `<div class="card"><p>ບໍ່ມີ KPI ລໍຖ້າອະນຸມັດ</p></div>`;
    h += `<p class="muted">KPI ເຫຼົ່ານີ້ ຜ່ານ HR ແລະ ຜູ້ອະນຸມັດແລ້ວ. ກົດຊື່ເພື່ອເບິ່ງລາຍລະອຽດ ຫຼື ສົ່ງກັບ.</p><div class="card">
      <label class="check"><input type="checkbox" id="pres-all" checked> <b>ເລືອກທັງໝົດ (${list.length})</b></label>
      ${list.map(k => { const e = S(k.emp) || {}; return `<div class="row" style="border-top:1px solid var(--line);padding:6px 0">
        <label class="check grow"><input type="checkbox" class="pres-k" value="${esc(k.emp)}" checked><span>${esc(e.name)}<br><span class="muted">${esc(e.pos)} · ${k.items.length} ຕົວຊີ້ວັດ</span></span></label>
        <a href="#kpi/${esc(k.emp)}" class="btn sm">ເບິ່ງ</a></div>`; }).join('')}</div>
      <button class="btn ok block" data-act="presAll">ອະນຸມັດທີ່ເລືອກ</button>`;
    return h;
  }

  // ---------- forms ----------
  function formSpec(n, e) {
    const g = G(e.group), Q = A.B.config.questions, k = kpiOf(e.code);
    if (n === 1) return { title: 'ປະເມີນລວມ (ຟອມ ①)', groups: [['iii', g.iii]].concat(g.w[3] ? [['iv', g.iv]] : []), items: k ? k.items : [], texts: ['str', 'imp', 'cmt'] };
    if (n === 2) return { title: f2Title(g) + ' (ຟອມ ②)', groups: [['q', Q[g.q2]], ['s', Q.sac]], texts: ['note'] };
    return { title: n === 3 ? 'ປະເມີນເພື່ອນຮ່ວມງານ (ຟອມ ③)' : 'ປະເມີນຫົວໜ້າ (ຟອມ ④)', groups: [['q', Q[n === 3 ? 'peer' : 'sub']]], texts: ['note'] };
  }
  const TEXT_T = { str: 'ຈຸດແຂງ', imp: 'ຈຸດທີ່ຄວນປັບປຸງ', cmt: 'ຄຳເຫັນໂດຍລວມ', note: 'ຄຳເຫັນເພີ່ມເຕີມ (ບໍ່ບັງຄັບ)' };
  const draftKey = (n, emp) => `kpi_draft_${A.B.round ? A.B.round.id : ''}_${n}_${emp}`;
  function vForm(nS, emp) {
    const n = Number(nS), e = S(emp);
    if (!e || !G(e.group) || ![1, 2, 3, 4].includes(n)) return notFound();
    const g = G(e.group), sp = formSpec(n, e);
    const prev = A.B.answersMine.find(a => a.form === n && a.emp === emp);
    const done = prev && prev.status === 'sub';
    let st = prev ? prev.ans : null;
    if (!done) { try { st = JSON.parse(LSG(draftKey(n, emp)) || 'null') || st; } catch (x) { /* ignore */ } }
    st = st || {};
    const kind = { 1: 'ປະເມີນລວມ', 2: f2Title(g), 3: 'ປະເມີນເພື່ອນຮ່ວມງານ', 4: 'ປະເມີນຫົວໜ້າ' }[n];
    let h = `<a class="back" href="#home">← ກັບຄືນ</a><div class="card fhead"><div class="fh-top"><div class="avatar lg" aria-hidden="true">${esc(initial(e.name))}</div>
      <div class="grow"><div class="fh-kind"><span class="chip fkind">${BADGE[n]} ຟອມ ${n}</span><span class="muted">${esc(kind)}</span></div>
      <h1>${esc(e.name)}</h1><div class="muted">${esc(e.pos)} · ${esc(e.dept)} · ກຸ່ມ ${esc(g.name)}</div></div>${done ? chip('ສົ່ງແລ້ວ ' + fdate(prev.at), 'ok') : ''}</div>`;
    if (done) h += `<div class="alert ok" style="margin:14px 0 0">ທ່ານສົ່ງຟອມນີ້ແລ້ວ. ຖ້າຕ້ອງແກ້ ໃຫ້ຕິດຕໍ່ HR.</div>`;
    else {
      h += `<div class="scale" aria-label="ຄວາມໝາຍຂອງຄະແນນ">${RATE.map((t, i) => `<span><i style="background:var(--g${i + 1})"></i>${i + 1} ${t}</span>`).join('')}</div>`;
      if (n >= 3) h += `<div class="fnote">${ic('shield')} ຊື່ຂອງທ່ານ ຈະບໍ່ສະແດງໃຫ້ຜູ້ຖືກປະເມີນ ຫຼື ຫົວໜ້າເຫັນ</div>`;
      if (n === 1) h += `<div class="ftiles-h muted small">ຄະແນນທີ່ທ່ານໃຫ້ຕອນນີ້ · ດ້ານ II ມາຈາກຟອມ ②③④</div><div id="live" class="ftiles"></div>`;
    }
    h += `</div><div id="fm" data-n="${n}" data-emp="${esc(emp)}">`;
    const sec = (key, num, title, sub, weight, rows) => `<section class="card fsec" data-sec="${key}"><div class="fsec-h"><span class="snum">${num}</span>
      <div class="grow"><h2>${title}</h2>${sub ? `<div class="muted small">${sub}</div>` : ''}</div>${weight ? chip(weight) : ''}${done ? '' : '<span class="sprog">0/0</span>'}</div><div class="qlist">${rows}</div></section>`;
    const rrow = (name, i, text, val) => `<div class="qrow" role="radiogroup" aria-labelledby="q-${name}-${i}" data-q="${name}.${i}"><div class="qt"><span class="qn">${i + 1}</span><span class="qtx" id="q-${name}-${i}">${esc(text)}</span></div>
      <div class="rate">${[1, 2, 3, 4, 5].map(v => `<label><input type="radio" name="${name}.${i}" value="${v}" ${val === v ? 'checked' : ''} ${done ? 'disabled' : ''}><span><b>${v}</b><small>${RATE[v - 1]}</small></span></label>`).join('')}</div></div>`;
    if (n === 1) {
      h += sec('i', 'I', 'ວຽກງານວິຊາສະເພາະ', 'ໃສ່ % ທີ່ບັນລຸເປົ້າໝາຍ (0–100) ຂອງແຕ່ລະຕົວຊີ້ວັດ', g.w[0] + '%', sp.items.map((it, i) =>
        `<div class="qrow krow" data-pitem="${i}"><div class="qt"><span class="qn">${i + 1}</span><div class="qtx"><b>${esc(it.t)}</b> ${chip(it.w + '%')}
          ${it.target ? `<div class="muted small">ເປົ້າໝາຍ: ${esc(it.target)}</div>` : ''}</div></div>
          <div class="kin"><div class="pin"><input class="in" type="number" inputmode="decimal" min="0" max="100" data-p="${i}" aria-label="% ບັນລຸ ${esc(it.t)}"
            value="${st.i && st.i[i] != null ? st.i[i] : ''}" ${done ? 'disabled' : ''}><span>%</span></div>
          ${done ? '' : `<div class="quick">${[100, 90, 80, 70, 60, 50].map(v => `<button type="button" data-act="setPct" data-i="${i}" data-v="${v}" aria-label="ຕັ້ງ ${v}%">${v}</button>`).join('')}</div>`}</div></div>`).join(''));
    }
    const HINT = 'ໃຫ້ຄະແນນ 1–5 ແຕ່ລະຂໍ້';
    const SEC = {
      iii: ['III', 'ລະບຽບວິໄນ', HINT, g.w[2] + '%'], iv: ['IV', 'ເສດຖະກິດ ການເມືອງ-ສັງຄົມ', HINT, g.w[3] + '%'],
      q: [n === 2 ? 'II' : ic(n === 3 ? 'users' : 'pulse'), n === 2 ? g.iiName : n === 3 ? 'ການຮ່ວມມື' : 'ພາວະຜູ້ນຳ ຂອງຫົວໜ້າ', HINT, ''],
      s: ['II', 'ຄວາມເສຍສະຫຼະຕໍ່ອົງກອນ', HINT, '']
    };
    for (const [name, qs] of sp.groups) h += sec(name, ...SEC[name], qs.map((q, i) => rrow(name, i, q, st[name] && st[name][i])).join(''));
    h += `<section class="card fsec"><div class="fsec-h"><span class="snum">${ic('file')}</span><div class="grow"><h2>ຄຳເຫັນ</h2></div></div><div class="tgrid">${sp.texts.map(t =>
      `<label class="f${t === 'cmt' || sp.texts.length === 1 ? ' wide' : ''}"><span>${TEXT_T[t]}</span><textarea class="in" data-t="${t}" maxlength="2000" ${done ? 'disabled' : ''}>${esc(st[t])}</textarea></label>`).join('')}</div></section></div>`;
    if (!done) {
      h += `<div class="fbar no-print"><div class="fb-prog"><div class="t" id="fmiss"></div><div class="bar" style="margin-top:6px"><i id="fbar"></i></div></div>
        <button id="fsub" class="btn pri" data-act="formSubmit"><span class="rdy">${ic('check')}</span> ສົ່ງຟອມ</button></div>`;
      A.after = updLive;
    }
    return h;
  }
  function collectForm() {
    const fm = $('#fm'); if (!fm) return null;
    const n = Number(fm.dataset.n), e = S(fm.dataset.emp), sp = formSpec(n, e), ans = {};
    if (n === 1) ans.i = sp.items.map((_, i) => { const v = $(`[data-p="${i}"]`, fm).value; return v === '' ? null : Number(v); });
    for (const [name, qs] of sp.groups) ans[name] = qs.map((_, i) => { const r = $(`input[name="${name}.${i}"]:checked`, fm); return r ? Number(r.value) : null; });
    for (const t of sp.texts) ans[t] = $(`[data-t="${t}"]`, fm).value;
    return { n, e, sp, ans };
  }
  function missing(c) {
    const miss = [];
    if (c.n === 1) c.ans.i.forEach((v, i) => { if (v == null || isNaN(v) || v < 0 || v > 100) miss.push(`[data-pitem="${i}"]`); });
    for (const [name] of c.sp.groups) c.ans[name].forEach((v, i) => { if (v == null) miss.push(`[data-q="${name}.${i}"]`); });
    return miss;
  }
  function updLive() {
    const c = collectForm(); if (!c) return;
    LSS(draftKey(c.n, c.e.code), JSON.stringify(c.ans));
    const miss = missing(c), total = c.sp.groups.reduce((a, [, qs]) => a + qs.length, 0) + (c.n === 1 ? c.sp.items.length : 0), got = total - miss.length;
    const t = $('#fmiss'); if (t) t.textContent = miss.length ? `ຕອບແລ້ວ ${got}/${total} ຂໍ້ · ຍັງເຫຼືອ ${miss.length}` : `ຕອບຄົບທຸກຂໍ້ແລ້ວ (${total}/${total})`;
    const bar = $('#fbar'); if (bar) bar.style.width = (total ? got / total * 100 : 0) + '%';
    const sub = $('#fsub'); if (sub) sub.classList.toggle('ready', !miss.length);
    $$('#fm .qrow').forEach(el => {
      const ok = el.dataset.q ? !!$('input:checked', el) : (() => { const v = $('[data-p]', el).value; return v !== '' && Number(v) >= 0 && Number(v) <= 100; })();
      el.classList.toggle('ans', ok); if (ok) el.classList.remove('miss');
    });
    $$('#fm .fsec[data-sec]').forEach(sec => {
      const rows = $$('.qrow', sec), k = rows.filter(r => r.classList.contains('ans')).length, sp = $('.sprog', sec);
      if (sp) { sp.textContent = `${k}/${rows.length}`; sp.classList.toggle('full', k === rows.length); }
    });
    const live = $('#live'); if (!live) return;
    const g = G(c.e.group), I = c.sp.items.reduce((s, it, i) => s + (c.ans.i[i] || 0) * it.w / 100, 0);
    const p3 = c.ans.iii.includes(null) ? null : pct15(c.ans.iii), p4 = !g.w[3] ? 100 : c.ans.iv.includes(null) ? null : pct15(c.ans.iv);
    const tile = (l, v, m) => `<div class="ftile"><small>${l}</small><b>${v}<span> / ${m}</span></b></div>`;
    live.innerHTML = tile('ດ້ານ I', f1d(I), g.w[0]) + tile('ດ້ານ III', p3 == null ? '—' : f1d(p3 * g.w[2] / 100), g.w[2]) + (g.w[3] ? tile('ດ້ານ IV', p4 == null ? '—' : f1d(p4 * g.w[3] / 100), g.w[3]) : '');
  }

  // ---------- results ----------
  function vResList() {
    if (can('results')) return vHr('results');
    const R = A.B.results;
    let h = `<h1>ຜົນປະເມີນ</h1>`;
    if (!R.length) return h + `<div class="card"><p>ຜົນຈະສະແດງຢູ່ນີ້ ຫຼັງຈາກ HR ປະກາດຜົນ.</p></div>`;
    const mine = R.filter(r => r.emp === me().code), subs = R.filter(r => r.emp !== me().code);
    h += mine.map(resRow).join('');
    if (subs.length) h += `<h2 style="margin-top:16px">ລູກນ້ອງໂດຍກົງ</h2><div class="card">${subs.map(resRow).join('')}</div>`;
    return h;
  }
  const gradeBox = r => `<div class="grade ${r.grade || 'none'}">${r.grade || 'ບໍ່ຄົບ'}</div>`;
  const resRow = r => `<a class="list-row" href="#res/${esc(r.emp)}" style="color:inherit;text-decoration:none">${gradeBox(r).replace('grade ', 'grade sm ')}
    <div class="grow"><b>${esc(r.name)}</b><div class="muted">${esc(r.dept)} · ${esc((G(r.group) || {}).name)}</div></div><b>${r.total == null ? '—' : f1d(r.total) + '%'}</b></a>`;
  function resBody(r) {
    const g = G(r.group), sp = g.split, P = r.parts;
    const part = (k, t) => sp[k] ? `<tr><td style="padding-left:20px">${t} (${sp[k]}%)</td><td></td><td class="n">${P[k] != null ? f1d(P[k]) + '%' : (r.few[k] ? '<span class="muted">ຂໍ້ມູນໜ້ອຍເກີນໄປ</span>' : '<span class="muted">ບໍ່ມີຂໍ້ມູນ</span>')}</td></tr>` : '';
    let h = `<div class="scroll"><table class="tbl"><thead><tr><th>ດ້ານ</th><th class="n">ນ້ຳໜັກ</th><th class="n">ຄະແນນ</th></tr></thead><tbody>
      <tr><td><b>I. ວຽກງານວິຊາສະເພາະ</b></td><td class="n">${g.w[0]}%</td><td class="n"><b>${f1d(r.I)}</b></td></tr>
      ${r.items.map((it, i) => `<tr><td style="padding-left:20px">${esc(it.t)}</td><td class="n">${it.w}%</td><td class="n">${r.f1 ? r.f1.i[i] + '%' : '—'}</td></tr>`).join('')}
      <tr><td><b>II. ${esc(g.iiName)}</b></td><td class="n">${g.w[1]}%</td><td class="n"><b>${f1d(r.II)}</b></td></tr>
      ${part('sup', 'ຫົວໜ້າສາຍງານ')}${part('sub', 'ລູກນ້ອງ')}${part('peer', 'ເພື່ອນຮ່ວມງານ')}${part('sac', 'ຄວາມເສຍສະຫຼະ')}
      <tr><td><b>III. ລະບຽບວິໄນ</b></td><td class="n">${g.w[2]}%</td><td class="n"><b>${f1d(r.III)}</b></td></tr>
      ${g.w[3] ? `<tr><td><b>IV. ເສດຖະກິດ ການເມືອງ-ສັງຄົມ</b></td><td class="n">${g.w[3]}%</td><td class="n"><b>${f1d(r.IV)}</b></td></tr>` : ''}
      <tr><td><b>ລວມ</b></td><td class="n">100%</td><td class="n"><b>${r.total == null ? '—' : f1d(r.total) + '%'}</b></td></tr></tbody></table></div>`;
    if (r.redistributed) h += `<p class="muted small">ໝາຍເຫດ: ບາງແຫຼ່ງໃນດ້ານ II ບໍ່ມີຄົນປະເມີນ — ນ້ຳໜັກຂອງແຫຼ່ງນັ້ນ ແບ່ງໃຫ້ແຫຼ່ງອື່ນຕາມສັດສ່ວນ.</p>`;
    if (r.f1) h += ['str', 'imp', 'cmt'].filter(t => r.f1[t]).map(t => `<p><b>${TEXT_T[t]}:</b> ${esc(r.f1[t])}</p>`).join('');
    return h;
  }
  function vRes(emp) {
    const r = A.B.results.find(x => x.emp === emp);
    const back = can('results') ? '#hr/results' : '#res';
    if (!r) return `<a class="back" href="${back}">← ກັບຄືນ</a><div class="card"><p>ຍັງບໍ່ມີຜົນ</p></div>`;
    return `<a class="back" href="${back}">← ກັບຄືນ</a><h1>${esc(r.name)}</h1><p class="muted">${esc(r.dept)} · ກຸ່ມ ${esc(G(r.group).name)} · ${esc(A.B.round.name)}</p>
      <div class="card"><div class="row">${gradeBox(r)}<div class="grow"><div class="big">${r.total == null ? '—' : f1d(r.total) + '%'}</div>
      <div>${r.grade ? 'ລະດັບ ' + r.grade + ' — ' + esc(gradeText(r.grade)) : 'ຍັງບໍ່ຄົບ: ຫົວໜ້າຍັງບໍ່ໄດ້ສົ່ງຟອມ ① ຫຼື KPI ຍັງບໍ່ອະນຸມັດ'}</div></div></div></div>
      <div class="card">${resBody(r)}</div><a class="btn block no-print" href="#print/${esc(emp)}">${ic('print')} ພິມຟອມ (A4)</a>`;
  }
  function vPrint(emp) {
    const r = A.B.results.find(x => x.emp === emp), e = S(emp);
    if (!r || !e) return notFound();
    return `<div class="no-print row" style="margin-bottom:12px"><a class="back grow" href="#res/${esc(emp)}">← ກັບຄືນ</a><button class="btn pri" data-act="print">${ic('print')} ພິມ</button></div>
      <div class="card"><div style="text-align:center"><b>${esc(A.B.config.orgName || '')}</b><h2 style="margin-top:6px">ແບບຟອມປະເມີນຜົນການປະຕິບັດວຽກ (KPI)</h2>
      <p>${esc(A.B.round.name)}</p></div>
      <p>ຊື່ ແລະ ນາມສະກຸນ: <b>${esc(e.name)}</b> &nbsp; ລະຫັດ: ${esc(e.code)}<br>ຕຳແໜ່ງ: ${esc(e.pos)} &nbsp; ພະແນກ: ${esc(e.dept)} &nbsp; ກຸ່ມ: ${esc(G(e.group).name)}</p>
      ${resBody(r)}
      <p><b>ຜົນການປະເມີນ:</b> ${r.total == null ? '—' : f1d(r.total) + '%'} ${r.grade ? '— ລະດັບ ' + r.grade + ' (' + esc(gradeText(r.grade)) + ')' : ''}</p>
      <div class="sign"><div>ຫົວໜ້າສາຍງານ<br>(ຜູ້ປະເມີນ)<br><br>${esc(nm(e.sup))}</div><div>ຫົວໜ້າ HR</div><div>ພະນັກງານ<br>(ຜູ້ຮັບການປະເມີນ)<br><br>${esc(e.name)}</div></div></div>`;
  }

  // ---------- HR ----------
  // [tab, ຊື່, ສິດທີ່ຕ້ອງມີ]
  const HR_TABS = [['progress', 'ຄວາມຄືບໜ້າ', 'progress'], ['staff', 'ພະນັກງານ', 'staff'], ['roles', 'ສິດ ແລະ ໜ້າທີ່', 'roles'], ['peers', 'ເພື່ອນຮ່ວມງານ', 'peers'],
    ['results', 'ຜົນ', 'results'], ['round', 'ຮອບປະເມີນ', 'round'], ['config', 'ຕັ້ງຄ່າ', 'config']];
  const hrTabs = () => HR_TABS.filter(t => can(t[2]));
  function vHr(tab, arg) {
    const tabs = hrTabs();
    if (!tabs.length) return notFound();
    tab = tab || tabs[0][0];
    const cur = { who: 'progress', import: 'staff', peer: 'peers' }[tab] || tab;
    if (!tabs.some(t => t[0] === cur)) return notFound();
    let h = `<h1>HR</h1><div class="tabs">${tabs.map(([k, t]) => `<a href="#hr/${k}" class="${cur === k ? 'on' : ''}">${t}</a>`).join('')}</div>`;
    const V = { progress: hrProgress, who: hrWho, staff: arg ? hrStaffEdit : hrStaff, import: hrImport, peers: hrPeers, peer: hrPeer, results: hrResults, round: hrRound, config: hrConfig, roles: arg ? hrRoleEdit : hrRoles }[tab];
    return h + (V ? V(arg) : '');
  }
  const evaluated = () => A.B.staff.filter(s => s.active !== false && G(s.group));
  function deptFilter() {
    const depts = [...new Set(evaluated().map(s => s.dept))].sort();
    return `<div class="row" style="margin-bottom:10px"><select class="in grow" id="hr-dept" style="min-width:160px"><option value="">ທຸກພະແນກ</option>
      ${depts.map(d => `<option ${A.hrDept === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>
      <label class="check"><input type="checkbox" id="hr-todo" ${A.hrTodo ? 'checked' : ''}> ສະເພາະທີ່ຍັງບໍ່ຄົບ</label></div>`;
  }
  // ໃຜຍັງຄ້າງຫຍັງ (ຄິດຈາກ progress + ລາຍການຄຳຕອບ)
  function owing() {
    const H = A.B.hr, r = A.B.round, owe = {};
    if (!H || !r) return owe;
    const add = (code, t) => { if (code) (owe[code] = owe[code] || []).push(t); };
    const has = (f, emp, by) => H.answers.some(a => a.form === f && a.emp === emp && a.by === by && a.status === 'sub');
    for (const p of H.progress) {
      const e = S(p.emp);
      if (['none', 'draft'].includes(p.kpi)) add(e.sup, 'ຕັ້ງ KPI: ' + e.name);
      if (p.kpi === 'ack') add(e.code, 'ຮັບຮູ້ KPI ຂອງຕົນ');
      if (r.status !== 'eval') continue;
      if (!p.f1 && p.kpi === 'ok') add(e.sup, '① ' + e.name);
      if (!p.f2) add(e.sup, '② ' + e.name);
      for (const pr of H.peers.filter(x => x.emp === e.code)) if (!has(3, e.code, pr.by)) add(pr.by, '③ ' + e.name);
      if (p.f4) for (const s of A.B.staff.filter(x => x.sup === e.code && x.active !== false)) if (!has(4, e.code, s.code)) add(s.code, '④ ' + e.name);
    }
    return owe;
  }
  function hrProgress() {
    const H = A.B.hr;
    if (!H) return `<div class="card"><p>ຍັງບໍ່ມີຮອບປະເມີນ — <a href="#hr/round">ສ້າງຮອບ</a></p></div>`;
    const P = H.progress, N = P.length, cnt = f => P.filter(f).length;
    const full = p => p.kpi === 'ok' && p.f1 && p.f2 && p.f3.done >= p.f3.of && (!p.f4 || p.f4.done >= p.f4.of);
    const kOk = cnt(p => p.kpi === 'ok'), f12 = cnt(p => p.f1 && p.f2), f3n = cnt(p => p.f3.of), f3d = cnt(p => p.f3.of && p.f3.done >= p.f3.of),
      f4n = cnt(p => p.f4), f4d = cnt(p => p.f4 && p.f4.done >= p.f4.of), noPeer = cnt(p => !p.f3.of);
    let h = `<div class="card-h"><h2>${esc(A.B.round.name)}</h2>${chip(ROUND_ST[A.B.round.status], 'teal')}</div><div class="stats">
      ${stat('KPI ອະນຸມັດແລ້ວ', 'file', `${kOk}<small> / ${N}</small>`, N - kOk ? `ຍັງເຫຼືອ ${N - kOk} ຄົນ` : 'ຄົບທຸກຄົນ', N ? kOk / N : 0)}
      ${stat('ຫົວໜ້າປະເມີນ ①②', 'shield', `${f12}<small> / ${N}</small>`, 'ສົ່ງຄົບທັງ 2 ຟອມ', N ? f12 / N : 0)}
      ${stat('ເພື່ອນປະເມີນ ③', 'users', `${f3d}<small> / ${f3n}</small>`, noPeer ? `${noPeer} ຄົນ ຍັງບໍ່ມີເພື່ອນ` : 'ຄົນທີ່ເພື່ອນສົ່ງຄົບ', f3n ? f3d / f3n : 0)}
      ${stat('ລູກນ້ອງປະເມີນ ④', 'pulse', `${f4d}<small> / ${f4n}</small>`, 'ຫົວໜ້າທີ່ລູກນ້ອງສົ່ງຄົບ', f4n ? f4d / f4n : 0)}</div>`;
    const noSup = P.filter(p => p.noSup);
    if (noSup.length) h += `<div class="alert bad">ບໍ່ມີຜູ້ປະເມີນ (ບໍ່ໄດ້ກຳນົດຫົວໜ້າ): ${noSup.map(p => esc(nm(p.emp))).join(', ')}</div>`;
    const owe = owing(), oweK = Object.keys(owe).sort((a, b) => owe[b].length - owe[a].length);
    if (oweK.length) h += `<details class="card"><summary><b>ຜູ້ທີ່ຍັງຄ້າງວຽກ (${oweK.length} ຄົນ)</b> — ໃຊ້ຕິດຕາມ</summary>${oweK.map(c =>
      `<div style="border-top:1px solid var(--line);padding:6px 0"><b>${esc(nm(c))}</b> <span class="chip warn">${owe[c].length}</span><div class="muted small">${owe[c].map(esc).join(' · ')}</div></div>`).join('')}</details>`;
    h += deptFilter();
    const rows = P.filter(p => (!A.hrDept || S(p.emp).dept === A.hrDept) && (!A.hrTodo || !full(p)));
    const tick = b => (b ? '<span class="chip ok">✓</span>' : '<span class="chip grey">–</span>');
    const frac = x => (x ? `<span class="chip ${x.of && x.done >= x.of ? 'ok' : 'grey'}">${x.done}/${x.of}</span>` : '');
    h += `<div class="card scroll"><table class="tbl"><thead><tr><th>ພະນັກງານ</th><th>KPI</th><th>①</th><th>②</th><th>③</th><th>④</th></tr></thead><tbody>
      ${rows.map(p => `<tr data-go="#hr/who/${esc(p.emp)}" style="cursor:pointer"><td><b>${esc(nm(p.emp))}</b><div class="muted small">${esc(S(p.emp).dept)}</div></td>
        <td>${kchip(p.kpi)}</td><td>${tick(p.f1)}</td><td>${tick(p.f2)}</td><td>${frac(p.f3)}</td><td>${frac(p.f4)}</td></tr>`).join('')}</tbody></table>
      ${rows.length ? '' : '<p class="muted">ບໍ່ມີລາຍການ</p>'}</div>`;
    return h;
  }
  function hrWho(emp) {
    const e = S(emp), H = A.B.hr;
    if (!e || !H) return notFound();
    const ans = H.answers.filter(a => a.emp === emp);
    const k = kpiOf(emp);
    let h = `<a class="back" href="#hr/progress">← ຄວາມຄືບໜ້າ</a><h2>${esc(e.name)}</h2><p class="muted">${esc(e.pos)} · ຫົວໜ້າ: ${esc(nm(e.sup))} · ຜູ້ອະນຸມັດ KPI: ${esc(nm(A.B.approvers[emp]))}</p>
      <div class="card row between"><span>KPI: ${kchip(k ? k.status : 'none')}</span><a class="btn sm" href="#kpi/${esc(emp)}">ເປີດ KPI</a></div>`;
    h += `<div class="card"><h3>ຟອມທີ່ກ່ຽວຂ້ອງ</h3>${ans.length ? ans.map(a => `<div class="row" style="border-top:1px solid var(--line);padding:6px 0">
      <span class="grow">${BADGE[a.form]} ໂດຍ ${esc(nm(a.by))} <span class="muted small">${fdate(a.at)}</span></span>
      ${a.status === 'sub' ? (A.B.round.status === 'eval' ? `<button class="btn sm" data-act="reopen" data-id="${esc(a.id)}">ເປີດຄືນໃຫ້ແກ້</button>` : chip('ສົ່ງແລ້ວ', 'ok')) : chip('ເປີດຄືນແລ້ວ', 'warn')}</div>`).join('') : '<p class="muted">ຍັງບໍ່ມີຟອມສົ່ງເຂົ້າມາ</p>'}</div>`;
    return h;
  }
  function hrStaff() {
    const q = A.hrQ.toLowerCase();
    const list = A.B.staff.filter(s => !q || [s.code, s.name, s.dept, s.pos].join(' ').toLowerCase().includes(q));
    const noPin = A.B.staff.filter(s => s.active !== false && !s.hasPin);
    let h = `<div class="btns" style="margin-top:0"><a class="btn pri" href="#hr/staff/new">+ ເພີ່ມພະນັກງານ</a><a class="btn" href="#hr/import">ນຳເຂົ້າຈາກ Excel</a></div>`;
    if (A.pins) {
      h += `<div class="card"><div class="alert bad">ພິມ ຫຼື ບັນທຶກ PIN ເຫຼົ່ານີ້ໄວ້ດຽວນີ້ — ຈະບໍ່ສະແດງອີກ</div><div class="scroll"><table class="tbl"><thead><tr><th>ລະຫັດ</th><th>ຊື່</th><th>PIN</th></tr></thead><tbody>
        ${A.pins.map(p => `<tr><td>${esc(p.code)}</td><td>${esc(nm(p.code))}</td><td><b>${p.pin}</b></td></tr>`).join('')}</tbody></table></div>
        <div class="btns"><button class="btn" data-act="print">${ic('print')} ພິມ</button><button class="btn" data-act="pinsCsv">ດາວໂຫຼດ CSV</button><button class="btn" data-act="pinsDone">ປິດ</button></div></div>`;
    } else if (noPin.length) h += `<div class="alert">ມີ ${noPin.length} ຄົນ ຍັງບໍ່ມີ PIN (ເຂົ້າລະບົບບໍ່ໄດ້). <button class="link" data-act="pinsGen">ສ້າງ PIN ໃຫ້ທັງໝົດ</button></div>`;
    h += `<input class="in" id="hr-q" placeholder="ຄົ້ນຫາ ຊື່ / ລະຫັດ / ພະແນກ" value="${esc(A.hrQ)}" style="margin:12px 0">
      <div class="card">${list.map(s => `<a class="list-row" href="#hr/staff/${esc(s.code)}" style="color:inherit;text-decoration:none">
        <div class="grow"><b>${esc(s.name)}</b> ${s.active === false ? chip('ປິດໃຊ້', 'grey') : ''}${(s.roles || []).map(r => ' ' + chip(roleName(r), r === 'ADMIN' ? 'teal' : '')).join('')}
        <div class="muted small">${esc(s.code)} · ${esc(s.pos)} · ${esc(s.dept)} · ${G(s.group) ? esc(G(s.group).name) : 'ບໍ່ຖືກປະເມີນ'} · ຫົວໜ້າ: ${esc(nm(s.sup))}</div></div>
        ${s.hasPin ? '' : chip('ບໍ່ມີ PIN', 'warn')}</a>`).join('') || '<p class="muted">ບໍ່ພົບ</p>'}</div>`;
    return h;
  }
  function staffOpts(sel, exclude, blank) {
    return `<option value="">${blank}</option>` + A.B.staff.filter(s => s.code !== exclude && s.active !== false)
      .map(s => `<option value="${esc(s.code)}" ${s.code === sel ? 'selected' : ''}>${esc(s.name)} (${esc(s.code)})</option>`).join('');
  }
  function hrStaffEdit(code) {
    const isNew = code === 'new', s = isNew ? { code: '', name: '', dept: '', div: '', pos: '', group: '', sup: '', appr: '', roles: [], active: true } : S(code);
    if (!s) return notFound();
    const fld = (k, t, extra) => `<label class="f"><span>${t}</span><input class="in" name="${k}" value="${esc(s[k])}" ${extra || ''}></label>`;
    const auto = !isNew && s.sup ? nm((S(s.sup) || {}).sup) : '—';
    return `<a class="back" href="#hr/staff">← ລາຍຊື່</a><h2>${isNew ? 'ເພີ່ມພະນັກງານ' : esc(s.name)}</h2>
      <form class="card" id="sf" data-submit="staffSave">
      <div class="fgrid">${fld('code', 'ລະຫັດພະນັກງານ *', isNew ? 'required autocapitalize="characters"' : 'readonly')}${fld('name', 'ຊື່ ແລະ ນາມສະກຸນ *', 'required')}
      ${fld('pos', 'ຕຳແໜ່ງ')}${fld('dept', 'ພະແນກ')}${fld('div', 'ຝ່າຍ')}</div>
      <label class="f"><span>ກຸ່ມ KPI</span><select class="in" name="group"><option value="">— ບໍ່ຖືກປະເມີນ (ເຊັ່ນ ຜູ້ອຳນວຍການ, ປະທານ)</option>
        ${Object.entries(A.B.config.groups).map(([k, g]) => `<option value="${k}" ${s.group === k ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
      <label class="f"><span>ຫົວໜ້າສາຍງານ (ຜູ້ປະເມີນຟອມ ① ②)</span><select class="in" name="sup">${staffOpts(s.sup, s.code, '— ບໍ່ມີ')}</select></label>
      <label class="f"><span>ຜູ້ອະນຸມັດ KPI (ວ່າງ = ຫົວໜ້າຂອງຫົວໜ້າ: ${esc(auto)})</span><select class="in" name="appr">${staffOpts(s.appr, s.code, '— ອັດຕະໂນມັດ')}</select></label>
      <div class="f"><span class="muted">ບົດບາດ ${can('roles') ? '' : '(ປ່ຽນໄດ້ສະເພາະຜູ້ມີສິດ "ກຳນົດສິດ")'}</span>${A.B.roles.map(r => `<label class="check"><input type="checkbox" name="role" value="${esc(r.code)}" ${s.roles.includes(r.code) ? 'checked' : ''} ${can('roles') ? '' : 'disabled'}> ${esc(r.name)}</label>`).join('')}
        <label class="check"><input type="checkbox" name="active" ${s.active !== false ? 'checked' : ''}> ໃຊ້ງານຢູ່</label></div>
      <button class="btn pri block">ບັນທຶກ</button></form>
      ${isNew ? '' : `<form class="card" data-submit="setPin"><h3>ຕັ້ງ PIN ໃໝ່</h3><p class="muted small">${s.hasPin ? 'ມີ PIN ແລ້ວ. ຕັ້ງໃໝ່ຈະອອກຈາກລະບົບທຸກເຄື່ອງຂອງຄົນນີ້.' : 'ຍັງບໍ່ມີ PIN.'}</p>
        <div class="row"><input class="in grow" id="newpin" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" placeholder="4–6 ຕົວເລກ" required style="width:auto">
        <button class="btn">ຕັ້ງ PIN</button></div></form>`}`;
  }
  const IMP_COLS = ['code', 'name', 'dept', 'div', 'pos', 'group', 'sup', 'appr', 'roles'];
  function hrImport() {
    let h = `<a class="back" href="#hr/staff">← ລາຍຊື່</a><div class="card"><h3>ນຳເຂົ້າພະນັກງານ ຈາກ Excel</h3>
      <p class="muted small">ກັອບປີ້ແຖວຈາກ Excel ແລ້ວວາງໃສ່ລຸ່ມນີ້. ລຳດັບຖັນ:<br><b>ລະຫັດ · ຊື່ ແລະ ນາມສະກຸນ · ພະແນກ · ຝ່າຍ · ຕຳແໜ່ງ · ກຸ່ມ KPI · ລະຫັດຫົວໜ້າ · ລະຫັດຜູ້ອະນຸມັດ · ລະຫັດບົດບາດ (${A.B.roles.map(r => esc(r.code)).join(', ')})</b><br>
      ກຸ່ມ KPI: ${Object.entries(A.B.config.groups).map(([k, g]) => esc(g.name)).join(', ')} (ຫຼື ວ່າງ). ລະຫັດທີ່ມີແລ້ວ ຈະຖືກອັບເດດ.</p>
      <textarea class="in" id="imp-text" rows="8" placeholder="E001	ນາງ ...	ບັນຊີ	..."></textarea>
      <button class="btn block" data-act="impParse" style="margin-top:8px">ກວດເບິ່ງກ່ອນ</button></div>`;
    if (A.imp) {
      h += `<div class="card"><h3>ຈະນຳເຂົ້າ ${A.imp.length} ຄົນ</h3><div class="scroll"><table class="tbl"><thead><tr><th>ລະຫັດ</th><th>ຊື່</th><th>ກຸ່ມ</th><th>ຫົວໜ້າ</th></tr></thead><tbody>
        ${A.imp.map(r => `<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td>${esc(G(r.group) ? G(r.group).name : r.group || '—')}</td><td>${esc(r.sup)}</td></tr>`).join('')}</tbody></table></div>
        <button class="btn pri block" data-act="impGo" style="margin-top:8px">ນຳເຂົ້າ</button></div>`;
    }
    return h;
  }
  function parseImport(text) {
    const groups = A.B.config.groups, gByName = {};
    for (const [k, g] of Object.entries(groups)) { gByName[g.name.trim()] = k; gByName[k] = k; }
    return text.split(/\r?\n/).map(l => l.split(l.includes('\t') ? '\t' : ',').map(x => x.trim())).filter(c => c.some(Boolean))
      .filter(c => c[0] !== 'ລະຫັດ').map(c => {
        const o = {}; IMP_COLS.forEach((k, i) => { o[k] = c[i] || ''; });
        o.group = gByName[o.group] !== undefined ? gByName[o.group] : o.group;
        return o;
      });
  }
  function peerLoad() { const L = {}; for (const p of (A.B.hr ? A.B.hr.peers : [])) L[p.by] = (L[p.by] || 0) + 1; return L; }
  function peerCands(emp) {
    const e = S(emp);
    return A.B.staff.filter(s => s.active !== false && G(s.group) && s.code !== emp && s.code !== e.sup && s.sup !== emp);
  }
  function suggestPeers(emp, load) {
    const e = S(emp);
    const c = peerCands(emp).map(s => ({ s, r: Math.random() }))
      .sort((a, b) => (a.s.dept === e.dept) - (b.s.dept === e.dept) || (load[a.s.code] || 0) - (load[b.s.code] || 0) || a.r - b.r);
    return c.slice(0, 3).map(x => x.s.code);
  }
  function hrPeers() {
    const H = A.B.hr;
    if (!H || !openRound()) return `<div class="card"><p>ກຳນົດເພື່ອນຮ່ວມງານໄດ້ ເມື່ອມີຮອບທີ່ເປີດຢູ່</p></div>`;
    const ev = evaluated(), none = ev.filter(e => !H.peers.some(p => p.emp === e.code));
    let h = `<p class="muted">ແຕ່ລະຄົນ ຄວນມີເພື່ອນ 2–3 ຄົນ ຈາກພະແນກທີ່ເຮັດວຽກພົວພັນກັນ. ເລືອກຫົວໜ້າ ຫຼື ລູກນ້ອງໂດຍກົງບໍ່ໄດ້.</p>`;
    if (none.length) h += `<div class="alert">${none.length} ຄົນ ຍັງບໍ່ມີເພື່ອນປະເມີນ. <button class="link" data-act="peerAutoAll">ແນະນຳອັດຕະໂນມັດໃຫ້ທັງ ${none.length} ຄົນ</button></div>`;
    h += deptFilter().replace(/<label class="check">.*<\/label>/, '');
    const load = peerLoad();
    h += `<div class="card">${ev.filter(e => !A.hrDept || e.dept === A.hrDept).map(e => {
      const ps = H.peers.filter(p => p.emp === e.code);
      return `<a class="list-row" href="#hr/peer/${esc(e.code)}" style="color:inherit;text-decoration:none"><div class="grow"><b>${esc(e.name)}</b> <span class="muted small">${esc(e.dept)}</span>
        <div class="small">${ps.length ? ps.map(p => chip(nm(p.by) + (load[p.by] > 5 ? ' ⚠' : ''))).join(' ') : '<span class="chip warn">ຍັງບໍ່ມີ</span>'}</div></div><span class="btn sm">ແກ້</span></a>`;
    }).join('')}</div>`;
    return h;
  }
  function hrPeer(emp) {
    const e = S(emp), H = A.B.hr;
    if (!e || !H) return notFound();
    const sel = A.peerSel && A.peerSel.emp === emp ? A.peerSel.list : H.peers.filter(p => p.emp === emp).map(p => p.by);
    A.peerSel = { emp, list: sel };
    const load = peerLoad(), cands = peerCands(emp).sort((a, b) => (sel.includes(b.code) - sel.includes(a.code)) || a.dept.localeCompare(b.dept));
    return `<a class="back" href="#hr/peers">← ເພື່ອນຮ່ວມງານ</a><h2>ເພື່ອນທີ່ຈະປະເມີນ ${esc(e.name)}</h2><p class="muted">${esc(e.dept)} · ເລືອກແລ້ວ ${sel.length} ຄົນ (ແນະນຳ 2–3, ສູງສຸດ 5)</p>
      <div class="btns" style="margin-top:0"><button class="btn" data-act="peerAuto">ແນະນຳອັດຕະໂນມັດ</button><button class="btn pri" data-act="peerSave">ບັນທຶກ</button></div>
      <div class="card" style="margin-top:12px">${cands.map(s => `<label class="check" style="border-bottom:1px solid var(--line)"><input type="checkbox" class="peer-c" value="${esc(s.code)}" ${sel.includes(s.code) ? 'checked' : ''}>
        <span class="grow">${esc(s.name)} <span class="muted small">${esc(s.dept)} · ${esc(s.pos)}</span></span>${load[s.code] ? chip('ປະເມີນ ' + load[s.code] + ' ຄົນ', load[s.code] >= 5 ? 'warn' : 'grey') : ''}</label>`).join('')}</div>`;
  }
  function hrResults() {
    const R = A.B.results.filter(r => !A.hrDept || r.dept === A.hrDept).slice().sort((a, b) => (b.total == null ? -1 : b.total) - (a.total == null ? -1 : a.total));
    const dist = ['A', 'B', 'C', 'D', 'E'].map(g => [g, R.filter(r => r.grade === g).length]);
    const st = A.B.round ? A.B.round.status : '';
    let h = st === 'setup' || st === 'eval' ? `<div class="alert info">ຜົນນີ້ ຄິດໄລ່ສົດ ຈາກຟອມທີ່ສົ່ງແລ້ວ — ຍັງບໍ່ແມ່ນຜົນສຸດທ້າຍ. ພະນັກງານຍັງບໍ່ເຫັນ.</div>` :
      st === 'closed' ? `<div class="alert">ປິດຮອບແລ້ວ ແຕ່ຍັງບໍ່ໄດ້ປະກາດ — ພະນັກງານຍັງບໍ່ເຫັນຜົນ. <a href="#hr/round">ປະກາດຜົນ</a></div>` : '';
    const max = Math.max(1, ...dist.map(d => d[1])), top = dist.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    h += `<div class="card"><div class="card-h">${ic('chart')}<h3>ຈຳນວນຄົນ ຕາມລະດັບ</h3><span class="muted small">ບໍ່ຄົບ: ${R.filter(r => !r.grade).length} ຄົນ</span></div>
      <div class="vbars" role="img" aria-label="${dist.map(([g, n]) => g + ' ' + n + ' ຄົນ').join(', ')}">${dist.map(([g, n]) => `<div class="col"><div class="track">${n ? `<div class="fill${g === top ? ' hi' : ''}" style="height:${n / max * 100}%">${n} ຄົນ</div>` : ''}</div>
        <span class="lbl">ລະດັບ ${g}</span></div>`).join('')}</div></div>`;
    h += deptFilter().replace(/<label class="check">.*<\/label>/, '');
    h += `<button class="btn block" data-act="resCsv">${ic('down')} ດາວໂຫຼດ Excel (CSV)</button><div class="card" style="margin-top:12px">${R.map(resRow).join('') || '<p class="muted">ບໍ່ມີ</p>'}</div>`;
    return h;
  }
  function hrRound() {
    const r = A.B.round, open = A.B.rounds.find(x => x.status === 'setup' || x.status === 'eval');
    const MOVES = {
      setup: [['eval', 'ເປີດໃຫ້ປະເມີນ', 'pri', 'ທຸກຄົນຈະເລີ່ມກອກຟອມ ①–④ ໄດ້. KPI ທີ່ຍັງບໍ່ອະນຸມັດ ຍັງດຳເນີນຕໍ່ໄດ້.']],
      eval: [['closed', 'ປິດຮອບ ແລະ ຄິດໄລ່ຜົນ', 'pri', 'ຟອມທີ່ຍັງບໍ່ສົ່ງ ຈະບໍ່ຖືກນັບ.'], ['setup', 'ກັບໄປໄລຍະຕັ້ງ KPI', '', '']],
      closed: [['published', 'ປະກາດຜົນ ໃຫ້ພະນັກງານເຫັນ', 'ok', 'ພະນັກງານ ແລະ ຫົວໜ້າ ຈະເຫັນຜົນຂອງຕົນ.'], ['eval', 'ເປີດປະເມີນຄືນ', '', '']],
      published: [['closed', 'ຖອນການປະກາດ', '', '']]
    };
    let h = '';
    if (r) h += `<div class="card"><div class="row between"><h2>${esc(r.name)}</h2>${chip(ROUND_ST[r.status])}</div>
      ${(MOVES[r.status] || []).map(([s, t, c, d]) => `<button class="btn ${c} block" style="margin-top:10px" data-act="roundMove" data-id="${esc(r.id)}" data-s="${s}" data-t="${esc(t)}">${t}</button>${d ? `<p class="muted small">${d}</p>` : ''}`).join('')}</div>`;
    if (!open) h += `<form class="card" data-submit="roundCreate"><h3>ສ້າງຮອບປະເມີນໃໝ່</h3>
      <label class="f"><span>ຊື່ຮອບ</span><input class="in" id="rn" required placeholder="ເຊັ່ນ ປີ ${new Date().getFullYear() + 1}"></label>
      <label class="check"><input type="checkbox" id="rcopy" checked> ສຳເນົາ KPI ຈາກຮອບກ່ອນ ເປັນຮ່າງ</label><button class="btn pri block">ສ້າງຮອບ</button></form>`;
    if (A.B.rounds.length > 1) h += `<div class="card"><h3>ທຸກຮອບ</h3>${A.B.rounds.slice().reverse().map(x =>
      `<div class="list-row" data-act="roundSel" data-id="${esc(x.id)}"><span class="grow">${esc(x.name)}</span>${chip(ROUND_ST[x.status])}${r && x.id === r.id ? ' ' + chip('ກຳລັງເບິ່ງ', 'ok') : ''}</div>`).join('')}</div>`;
    return h;
  }
  function hrConfig() {
    const C = A.B.config, locked = A.B.rounds.some(r => r.status === 'eval');
    const lines = a => esc((a || []).join('\n'));
    const QT = { lead: 'ຟອມ ② ກຸ່ມຫົວໜ້າ', staff: 'ຟອມ ② ກຸ່ມວິຊາການ/ບໍລິການ', audit: 'ຟອມ ② ກວດສອບພາຍໃນ', sac: 'ຟອມ ② ຄວາມເສຍສະຫຼະ', peer: 'ຟອມ ③ ເພື່ອນຮ່ວມງານ', sub: 'ຟອມ ④ ລູກນ້ອງປະເມີນຫົວໜ້າ' };
    const num = (k, i, v) => `<input class="in" type="number" min="0" max="100" data-c="${k}" data-ci="${i}" value="${v}" style="min-height:40px;padding:4px 6px" aria-label="${i}">`;
    let h = locked ? `<div class="alert">ກຳລັງປະເມີນຢູ່ — ແກ້ການຕັ້ງຄ່າບໍ່ໄດ້ຈົນກວ່າຈະປິດຮອບ</div>` : `<div class="alert info">ໜຶ່ງແຖວ = ໜຶ່ງຂໍ້. ນ້ຳໜັກ 4 ດ້ານ ແລະ ສັດສ່ວນດ້ານ II ຕ້ອງລວມ = 100.</div>`;
    h += `<fieldset id="cfg" ${locked ? 'disabled' : ''} style="border:0;padding:0;margin:0">
      <div class="card"><label class="f"><span>ຊື່ບໍລິສັດ (ສະແດງໃນໃບພິມ)</span><input class="in" id="c-org" value="${esc(C.orgName || '')}"></label>
      <label class="f"><span>ແມ່ແບບຕົວຊີ້ວັດດ້ານ I (ສະເໜີໃຫ້ຫົວໜ້າຕອນຕັ້ງ KPI)</span><textarea class="in" id="c-itpl" rows="4">${lines(C.iTemplate)}</textarea></label></div>`;
    for (const [k, g] of Object.entries(C.groups)) {
      h += `<details class="card" data-g="${k}"><summary><b>${esc(g.name)}</b> — ${g.w.join(' / ')}</summary>
        <div class="scroll"><table class="tbl"><tr><th>ດ້ານ I</th><th>II</th><th>III</th><th>IV</th></tr><tr>${g.w.map((v, i) => `<td>${num('w', i, v)}</td>`).join('')}</tr>
        <tr><th>ຫົວໜ້າ</th><th>ລູກນ້ອງ</th><th>ເພື່ອນ</th><th>ເສຍສະຫຼະ</th></tr><tr>${['sup', 'sub', 'peer', 'sac'].map(s => `<td>${num('sp', s, g.split[s])}</td>`).join('')}</tr></table></div>
        <label class="f"><span>ຊື່ດ້ານ II</span><input class="in" data-c="iiName" value="${esc(g.iiName)}"></label>
        <label class="f"><span>ລາຍການດ້ານ III (ລະບຽບວິໄນ)</span><textarea class="in" data-c="iii" rows="5">${lines(g.iii)}</textarea></label>
        <label class="f"><span>ລາຍການດ້ານ IV</span><textarea class="in" data-c="iv" rows="3">${lines(g.iv)}</textarea></label></details>`;
    }
    h += `<div class="card"><h3>ຄຳຖາມ</h3>${Object.entries(QT).map(([q, t]) => `<label class="f"><span>${t}</span><textarea class="in" data-q="${q}" rows="5">${lines(C.questions[q])}</textarea></label>`).join('')}</div>
      <button class="btn pri block" data-act="cfgSave">ບັນທຶກການຕັ້ງຄ່າ</button></fieldset>`;
    return h;
  }
  function roleMembers(code) { return A.B.staff.filter(s => s.active !== false && (s.roles || []).includes(code)); }
  function hrRoles() {
    const R2 = A.B.roles, act = A.B.staff.filter(s => s.active !== false), none = act.filter(s => !(s.roles || []).length).length;
    const segs = R2.map(r => [r.name, roleMembers(r.code).length]).concat([['ພະນັກງານທົ່ວໄປ', none]]).filter(x => x[1]);
    const COL = ['var(--accent)', 'var(--teal)', '#1f2937', '#e7b416', '#7cbf3b', '#ef8a2f', '#6b7280'], tot = segs.reduce((a, b) => a + b[1], 0) || 1;
    let h = `<div class="alert info">ສິດ ແມ່ນສິ່ງທີ່ບົດບາດນັ້ນເຮັດໄດ້ໃນໜ້າ HR. ໜ້າທີ່ປະເມີນ (ຫົວໜ້າ, ຜູ້ອະນຸມັດ, ເພື່ອນ) ກຳນົດໃນໜ້າ "ພະນັກງານ" ແລະ "ເພື່ອນຮ່ວມງານ". ປ່ຽນແລ້ວ ມີຜົນທັນທີ.</div>
      <div class="card"><div class="card-h">${ic('users')}<h3>ການແບ່ງບົດບາດ</h3><span class="muted small">${act.length} ຄົນ</span></div>
      <div class="rbar" role="img" aria-label="${segs.map(x => esc(x[0]) + ' ' + x[1]).join(', ')}">${segs.map((x, i) => `<i style="flex:${x[1]};background:${COL[i % COL.length]}"></i>`).join('')}</div>
      <div class="legend" style="margin-top:8px">${segs.map((x, i) => `<span><i style="background:${COL[i % COL.length]}"></i>${esc(x[0])} <b>${x[1]}</b></span>`).join('')}</div></div>
      <div class="btns" style="margin-top:0;margin-bottom:12px"><a class="btn pri" href="#hr/roles/new">+ ສ້າງບົດບາດໃໝ່</a></div>`;
    h += `<div class="duties">${R2.map(r => {
      const m = roleMembers(r.code);
      return `<a class="card" href="#hr/roles/${esc(r.code)}"><div class="card-h">${ic('shield')}<h3>${esc(r.name)}</h3>${chip(r.code, r.code === 'ADMIN' ? 'teal' : 'grey')}</div>
        <div class="small" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">${r.perms.length ? r.perms.map(p => chip((PERM_T[p] || [p])[0])).join('') : '<span class="muted">ບໍ່ມີສິດໃນໜ້າ HR</span>'}</div>
        <div class="muted small">${m.length ? m.length + ' ຄົນ: ' + m.slice(0, 4).map(x => esc(x.name)).join(', ') + (m.length > 4 ? ' …' : '') : 'ຍັງບໍ່ມີໃຜ'}</div></a>`;
    }).join('')}</div>`;
    return h;
  }
  function hrRoleEdit(code) {
    const isNew = code === 'new', r = isNew ? { code: '', name: '', perms: [] } : A.B.roles.find(x => x.code === code);
    if (!r) return notFound();
    const locked = r.code === 'ADMIN';
    if (!A.rsel || A.rsel.code !== code) A.rsel = { code, list: isNew ? [] : roleMembers(r.code).map(s => s.code) };
    const q = (A.rq || '').toLowerCase();
    const people = A.B.staff.filter(s => s.active !== false && (!q || (s.name + ' ' + s.code + ' ' + s.dept).toLowerCase().includes(q)));
    return `<a class="back" href="#hr/roles">← ສິດ ແລະ ໜ້າທີ່</a><h2>${isNew ? 'ສ້າງບົດບາດໃໝ່' : esc(r.name)}</h2>
      <form class="card" id="rf" data-submit="roleSave">
        <div class="row"><label class="f grow"><span>ຊື່ບົດບາດ *</span><input class="in" name="name" value="${esc(r.name)}" required maxlength="60" ${locked ? 'readonly' : ''} placeholder="ເຊັ່ນ ຜູ້ຊ່ວຍ HR"></label>
        <label class="f" style="width:170px"><span>ລະຫັດ (ອັງກິດ) *</span><input class="in" name="code" value="${esc(r.code)}" required pattern="[A-Za-z0-9_]{2,20}" ${isNew ? '' : 'readonly'} autocapitalize="characters" placeholder="HRASSIST"></label></div>
        <div class="sec-h"><h3>ສິດ</h3>${locked ? chip('Admin ມີທຸກສິດສະເໝີ', 'teal') : ''}</div>
        ${Object.entries(PERM_T).map(([k, [t, d]]) => `<label class="check" style="align-items:flex-start;border-bottom:1px solid var(--line);padding:8px 0">
          <input type="checkbox" name="perm" value="${k}" ${r.perms.includes(k) || locked ? 'checked' : ''} ${locked ? 'disabled' : ''} style="margin-top:4px">
          <span><b>${t}</b><br><span class="muted small">${d}</span></span></label>`).join('')}
        <div class="sec-h" style="margin-top:16px"><h3 id="rmem-n">ຄົນທີ່ມີບົດບາດນີ້ (${A.rsel.list.length})</h3></div>
        ${can('staff') ? `<input class="in" id="rq" placeholder="ຄົ້ນຫາຊື່ / ລະຫັດ / ພະແນກ" value="${esc(A.rq || '')}" style="margin-bottom:8px">
        <div style="max-height:320px;overflow-y:auto">${people.map(s => `<label class="check" style="border-bottom:1px solid var(--line)"><input type="checkbox" class="rmem" value="${esc(s.code)}" ${A.rsel.list.includes(s.code) ? 'checked' : ''}>
          <span class="grow">${esc(s.name)} <span class="muted small">${esc(s.code)} · ${esc(s.pos)} · ${esc(s.dept)}</span></span></label>`).join('')}</div>`
        : `<p class="muted small">ການເລືອກຄົນ ຕ້ອງມີສິດ "ຈັດການພະນັກງານ" ນຳ</p>`}
        <div class="btns">${isNew || locked ? '' : `<button type="button" class="btn bad" data-act="roleDel" data-code="${esc(r.code)}">ລຶບບົດບາດ</button>`}<button class="btn pri">ບັນທຶກ</button></div>
      </form>`;
  }
  function notFound() { return `<a class="back" href="#home">← ກັບຄືນ</a><div class="card"><p>ບໍ່ພົບໜ້ານີ້ ຫຼື ທ່ານບໍ່ມີສິດເບິ່ງ</p></div>`; }

  // ---------- render ----------
  const CRUMB = { home: 'ວຽກຂອງຂ້ອຍ', kpi: 'KPI ດ້ານ I', pres: 'ອະນຸມັດ KPI', form: 'ຟອມປະເມີນ', res: 'ຜົນປະເມີນ', print: 'ພິມຟອມ', hr: 'HR' };
  function crumbs(r, p) {
    const parts = [`<a href="#home">${ic('home')}</a>`];
    if (r === 'hr') {
      const k = { who: 'progress', import: 'staff', peer: 'peers' }[p[0]] || p[0] || 'progress';
      parts.push(`<a href="#hr">HR</a>`, `<b>${(HR_TABS.find(t => t[0] === k) || [0, ''])[1]}</b>`);
    } else parts.push(`<b>${CRUMB[r] || CRUMB.home}</b>`);
    return `<nav class="crumbs no-print" aria-label="breadcrumb">${parts.join('<span class="sep">›</span>')}</nav>`;
  }
  let lastRoute = '';
  function render() {
    A.after = null;
    let html;
    if (!A.mode) html = vSetup();
    else if (!A.B) html = vLogin();
    else {
      chrome();
      const [r, ...p] = (location.hash.slice(1) || 'home').split('/').map(decodeURIComponent);
      const R = { home: vHome, kpi: vKpi, pres: vPres, form: vForm, res: p.length ? vRes : vResList, print: vPrint, hr: vHr };
      if (r !== 'kpi') A.kedit = null;
      if (r !== 'hr' || p[0] !== 'peer') A.peerSel = null;
      if (r !== 'hr' || p[0] !== 'roles' || !p[1]) { A.rsel = null; A.rq = ''; }
      html = crumbs(r, p) + (R[r] || vHome)(...p);
    }
    $('#view').innerHTML = `<div class="wrap">${html}</div>`;
    if (location.hash !== lastRoute) { window.scrollTo(0, 0); lastRoute = location.hash; }
    if (A.after) A.after();
  }

  // ---------- actions ----------
  const ACT = {
    async setApi() {
      const url = $('#api-url').value.trim();
      if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) return toast('ລິ້ງຕ້ອງເປັນ https://script.google.com/…/exec', 'err');
      try {
        const r = await (await fetch(url)).json();
        if (!r || r.app !== 'kpi') throw new Error();
      } catch (e) { return toast('ເຊື່ອມຕໍ່ບໍ່ໄດ້ — ກວດລິ້ງອີກຄັ້ງ', 'err'); }
      LSS('kpi_api', url); LSS('kpi_mode', 'live'); A.api = url; A.mode = 'live'; render();
    },
    demo() { LSS('kpi_mode', 'demo'); A.mode = 'demo'; A.store = makeDemoStore(); render(); },
    resetMode() { LSS('kpi_mode', null); A.mode = null; A.B = null; render(); },
    demoLogin(el) { call('login', { code: el.dataset.code, pin: '1234' }).then(r => { if (r.ok) go('#home'); }); },
    async logout() { await call('logout', {}, { noRender: true }); LSS(tokKey(), null); A.B = null; location.hash = ''; render(); },
    demoReset() { if (!confirm('ລ້າງຂໍ້ມູນທົດລອງທັງໝົດ ແລະ ເລີ່ມໃໝ່?')) return; A.store.reset(); LSS(tokKey(), null); A.B = null; location.hash = ''; render(); },
    kpiAdd() { A.kedit.items.push({ t: '', target: '', w: '' }); render(); },
    kpiDel(el) { A.kedit.items.splice(Number(el.dataset.i), 1); render(); },
    async kpiSave(el, submit) {
      const items = A.kedit.items.map(it => ({ t: String(it.t).trim(), target: String(it.target).trim(), w: Number(it.w) }));
      if (!items.length) return toast('ຕ້ອງມີຕົວຊີ້ວັດຢ່າງໜ້ອຍ 1 ຂໍ້', 'err');
      if (items.some(it => !it.t || !(it.w > 0))) return toast('ກະລຸນາໃສ່ຊື່ ແລະ ນ້ຳໜັກ ທຸກຕົວຊີ້ວັດ', 'err');
      const emp = A.kedit.emp;
      const r = await call('kpiSave', { emp, items }, { noRender: true });
      if (!r.ok) return render();
      if (submit !== true) { A.kedit = null; toast('ບັນທຶກຮ່າງແລ້ວ', 'ok'); return render(); }
      const r2 = await call('kpiSubmit', { emp }, { noRender: true });
      A.kedit = null;
      if (r2.ok) { toast('ສົ່ງໃຫ້ພະນັກງານຮັບຮູ້ແລ້ວ', 'ok'); go('#home'); } else render();
    },
    kpiSubmit(el) {
      const e = S(A.kedit.emp), need = G(e.group).w[0], sum = A.kedit.items.reduce((s, it) => s + (Number(it.w) || 0), 0);
      if (sum !== need) return toast(`ນ້ຳໜັກລວມຕ້ອງ = ${need}% (ດຽວນີ້ ${sum}%)`, 'err');
      return ACT.kpiSave(el, true);
    },
    async kpiDecide(el) {
      const ok = el.dataset.ok === '1', msg = ($('#kmsg') || {}).value || '', a = el.dataset.a, emp = el.dataset.emp;
      if (!ok && !msg.trim()) { toast('ກະລຸນາຂຽນເຫດຜົນ', 'err'); return $('#kmsg').focus(); }
      const extra = a === 'kpiPres' ? { emps: [emp], ok, msg } : a === 'kpiAck' ? { ok, msg } : { emp, ok, msg };
      const r = await call(a, extra, { noRender: true });
      if (r.ok) { toast(ok ? 'ສຳເລັດ' : 'ສົ່ງກັບແລ້ວ', 'ok'); go('#home'); } else render();
    },
    async kpiUnlock(el) { if (confirm('ປົດລັອກ KPI ນີ້? ຈະຕ້ອງຜ່ານການອະນຸມັດໃໝ່ທັງໝົດ.')) await call('kpiUnlock', { emp: el.dataset.emp }); },
    async presAll() {
      const emps = $$('.pres-k:checked').map(x => x.value);
      if (!emps.length) return toast('ຍັງບໍ່ໄດ້ເລືອກ', 'err');
      if (!confirm(`ອະນຸມັດ KPI ${emps.length} ຄົນ?`)) return;
      const r = await call('kpiPres', { emps, ok: true }, { noRender: true });
      if (r.ok) { toast('ອະນຸມັດແລ້ວ ' + emps.length + ' ຄົນ', 'ok'); go('#home'); } else render();
    },
    setPct(el) { const i = $(`[data-p="${el.dataset.i}"]`); i.value = el.dataset.v; updLive(); },
    async formSubmit() {
      const c = collectForm(), miss = missing(c);
      $$('.qrow.miss').forEach(x => x.classList.remove('miss'));
      if (miss.length) {
        miss.forEach(s => { const el = $(s); if (el) el.classList.add('miss'); });
        $(miss[0]).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return toast(`ຍັງຕອບບໍ່ຄົບ ${miss.length} ຂໍ້ (ໝາຍສີແດງ)`, 'err');
      }
      if (!confirm('ສົ່ງຟອມນີ້? ສົ່ງແລ້ວຈະແກ້ໄຂບໍ່ໄດ້.')) return;
      const r = await call('answerSubmit', { form: c.n, emp: c.e.code, ans: c.ans }, { noRender: true });
      if (r.ok) { LSS(draftKey(c.n, c.e.code), null); toast('ສົ່ງແລ້ວ ຂອບໃຈ!', 'ok'); go('#home'); } else render();
    },
    print() { window.print(); },
    async reopen(el) { if (confirm('ເປີດຟອມນີ້ຄືນ ໃຫ້ຜູ້ປະເມີນແກ້ໄຂ ແລະ ສົ່ງໃໝ່?')) await call('answerReopen', { id: el.dataset.id }); },
    async pinsGen() {
      const list = A.B.staff.filter(s => s.active !== false && !s.hasPin).map(s => {
        const n = new Uint32Array(1); crypto.getRandomValues(n); return { code: s.code, pin: String(100000 + (n[0] % 900000)) };
      });
      if (!confirm(`ສ້າງ PIN 6 ຕົວເລກ ໃຫ້ ${list.length} ຄົນ?`)) return;
      const r = await call('setPin', { list }, { noRender: true });
      if (r.ok) A.pins = list;
      render();
    },
    pinsCsv() { dlCsv('pin.csv', [['ລະຫັດ', 'ຊື່', 'PIN']].concat(A.pins.map(p => [p.code, nm(p.code), p.pin]))); },
    pinsDone() { if (confirm('ປິດລາຍການ PIN? ຈະບໍ່ສະແດງອີກ.')) { A.pins = null; render(); } },
    impParse() {
      const rows = parseImport($('#imp-text').value);
      if (!rows.length) return toast('ບໍ່ພົບຂໍ້ມູນ', 'err');
      A.imp = rows; const t = $('#imp-text').value; render(); $('#imp-text').value = t;
    },
    async impGo() {
      const r = await call('staffImport', { rows: A.imp.map(x => Object.assign({}, x, { roles: x.roles })) }, { noRender: true });
      if (r.ok) { toast(`ນຳເຂົ້າແລ້ວ ${A.imp.length} ຄົນ`, 'ok'); A.imp = null; go('#hr/staff'); } else render();
    },
    peerAuto() {
      const load = peerLoad();
      for (const c of A.peerSel.list) load[c] = Math.max(0, (load[c] || 0) - 1);
      A.peerSel.list = suggestPeers(A.peerSel.emp, load); render();
    },
    async peerSave() {
      if (A.peerSel.list.length > 5) return toast('ເລືອກໄດ້ບໍ່ເກີນ 5 ຄົນ', 'err');
      const r = await call('peerSet', { emp: A.peerSel.emp, peers: A.peerSel.list }, { noRender: true });
      if (r.ok) { toast('ບັນທຶກແລ້ວ', 'ok'); A.peerSel = null; go('#hr/peers'); } else render();
    },
    async peerAutoAll() {
      const H = A.B.hr, load = peerLoad();
      const list = evaluated().filter(e => !H.peers.some(p => p.emp === e.code)).map(e => {
        const peers = suggestPeers(e.code, load); peers.forEach(c => { load[c] = (load[c] || 0) + 1; }); return { emp: e.code, peers };
      });
      if (!confirm(`ກຳນົດເພື່ອນໃຫ້ ${list.length} ຄົນ ອັດຕະໂນມັດ? (ແກ້ໄຂແຕ່ລະຄົນໄດ້ພາຍຫຼັງ)`)) return;
      const r = await call('peerSet', { list });
      if (r.ok) toast('ກຳນົດແລ້ວ', 'ok');
    },
    resCsv() {
      const g = c => (G(c) || {}).name || c, f1d = x => (x == null ? '' : (Math.round(x * 10) / 10).toFixed(1));
      dlCsv(`kpi_${A.B.round.name}.csv`, [['ລະຫັດ', 'ຊື່', 'ພະແນກ', 'ກຸ່ມ', 'ດ້ານ I', 'ດ້ານ II', 'ດ້ານ III', 'ດ້ານ IV', 'ລວມ %', 'ລະດັບ']]
        .concat(A.B.results.map(r => [r.emp, r.name, r.dept, g(r.group), f1d(r.I), f1d(r.II), f1d(r.III), f1d(r.IV), f1d(r.total), r.grade || 'ບໍ່ຄົບ'])));
    },
    async roundMove(el) { if (confirm(el.dataset.t + '?')) await call('roundStatus', { id: el.dataset.id, status: el.dataset.s }); },
    async roundSel(el) { A.roundSel = el.dataset.id || null; await call('boot'); },
    async cfgSave() {
      const C = JSON.parse(JSON.stringify(A.B.config)), lines = v => v.split('\n').map(x => x.trim()).filter(Boolean);
      C.orgName = $('#c-org').value; C.iTemplate = lines($('#c-itpl').value);
      for (const d of $$('#cfg details[data-g]')) {
        const g = C.groups[d.dataset.g];
        $$('[data-c="w"]', d).forEach(i => { g.w[Number(i.dataset.ci)] = Number(i.value); });
        $$('[data-c="sp"]', d).forEach(i => { g.split[i.dataset.ci] = Number(i.value); });
        g.iiName = $('[data-c="iiName"]', d).value; g.iii = lines($('[data-c="iii"]', d).value); g.iv = lines($('[data-c="iv"]', d).value);
      }
      $$('#cfg textarea[data-q]').forEach(t => { C.questions[t.dataset.q] = lines(t.value); });
      const errs = validateConfig(C);
      if (errs.length) return toast(errs.join('\n'), 'err');
      const r = await call('configSave', { config: C });
      if (r.ok) toast('ບັນທຶກແລ້ວ', 'ok');
    }
  };
  ACT.roleDel = async el => {
    if (!confirm('ລຶບບົດບາດນີ້?')) return;
    const r = await call('roleDelete', { code: el.dataset.code }, { noRender: true });
    if (r.ok) { toast('ລຶບແລ້ວ', 'ok'); A.rsel = null; go('#hr/roles'); } else render();
  };
  const SUBMIT = {
    login() { call('login', { code: $('#lg-code').value, pin: $('#lg-pin').value }).then(r => { if (r.ok) go('#home'); }); },
    async staffSave(form) {
      const fd = new FormData(form), row = {};
      for (const k of ['code', 'name', 'pos', 'dept', 'div', 'group', 'sup', 'appr']) row[k] = String(fd.get(k) || '');
      row.roles = can('roles') ? fd.getAll('role') : ((S(row.code) || {}).roles || []); row.active = fd.get('active') === 'on';
      const r = await call('staffSave', { row }, { noRender: true });
      if (r.ok) { toast('ບັນທຶກແລ້ວ', 'ok'); go('#hr/staff'); } else render();
    },
    async setPin() {
      const code = location.hash.split('/')[2], pin = $('#newpin').value;
      const r = await call('setPin', { code: decodeURIComponent(code), pin }, { noRender: true });
      if (r.ok) toast('ຕັ້ງ PIN ແລ້ວ', 'ok');
      render();
    },
    async roleSave(form) {
      const fd = new FormData(form), code = String(fd.get('code') || '').trim().toUpperCase();
      const was = roleMembers(code).map(s => s.code), want = A.rsel ? A.rsel.list : was;
      if (code !== 'ADMIN') {
        const r = await call('roleSave', { role: { code, name: fd.get('name'), perms: fd.getAll('perm') } }, { noRender: true });
        if (!r.ok) return render();
      }
      const changed = A.B.staff.filter(s => was.includes(s.code) !== want.includes(s.code)).map(s => {
        const roles = (s.roles || []).filter(x => x !== code).concat(want.includes(s.code) ? [code] : []);
        return { code: s.code, name: s.name, dept: s.dept, div: s.div, pos: s.pos, group: s.group, sup: s.sup, appr: s.appr, roles, active: s.active };
      });
      if (changed.length && can('staff')) {
        const r2 = await call('staffImport', { rows: changed }, { noRender: true });
        if (!r2.ok) return render();
      }
      toast('ບັນທຶກແລ້ວ — ມີຜົນທັນທີ', 'ok'); A.rsel = null; go('#hr/roles');
    },
    async roundCreate() {
      const r = await call('roundCreate', { name: $('#rn').value, copyKpi: $('#rcopy').checked }, { noRender: true });
      A.roundSel = null;
      if (r.ok) toast('ສ້າງຮອບແລ້ວ', 'ok');
      render();
    }
  };
  function dlCsv(name, rows) {
    const csv = '﻿' + rows.map(r => r.map(v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  document.addEventListener('click', e => {
    const go2 = e.target.closest('[data-go]');
    if (go2 && !e.target.closest('a,button')) return go(go2.dataset.go);
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    e.preventDefault();
    ACT[el.dataset.act](el, e);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-submit]');
    if (!f) return;
    e.preventDefault(); SUBMIT[f.dataset.submit](f);
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.kf && A.kedit) { A.kedit.items[Number(t.dataset.i)][t.dataset.kf] = t.value; updWsum(); }
    else if (t.closest('#fm')) updLive();
    else if (t.id === 'rq') { A.rq = t.value; render(); const q = $('#rq'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    else if (t.id === 'hr-q') { A.hrQ = t.value; render(); const q = $('#hr-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.closest('#fm')) updLive();
    else if (t.id === 'hr-dept') { A.hrDept = t.value; render(); }
    else if (t.id === 'hr-todo') { A.hrTodo = t.checked; render(); }
    else if (t.classList.contains('rmem')) {
      const l = A.rsel.list;
      if (t.checked) { if (!l.includes(t.value)) l.push(t.value); } else l.splice(l.indexOf(t.value), 1);
      const h3 = $('#rmem-n'); if (h3) h3.textContent = `ຄົນທີ່ມີບົດບາດນີ້ (${l.length})`;
    }
    else if (t.id === 'pres-all') $$('.pres-k').forEach(x => { x.checked = t.checked; });
    else if (t.classList.contains('peer-c')) {
      const l = A.peerSel.list;
      if (t.checked) { if (!l.includes(t.value)) l.push(t.value); } else l.splice(l.indexOf(t.value), 1);
      render();
    } else if (t.id === 'demo-who') {
      const code = t.value;
      call('logout', {}, { noRender: true }).then(() => call('login', { code, pin: '1234' })).then(r => { if (r.ok) go('#home'); });
    }
  });
  window.addEventListener('hashchange', render);

  // ---------- start ----------
  const qApi = new URLSearchParams(location.search).get('api');
  if (qApi && /^https:\/\/script\.google\.com\/.+\/exec$/.test(qApi)) {
    LSS('kpi_api', qApi); LSS('kpi_mode', 'live'); A.api = qApi; A.mode = 'live';
    history.replaceState(null, '', location.pathname + location.hash);
  }
  if (A.mode === 'demo') A.store = makeDemoStore();
  if (A.mode && LSG(tokKey())) call('boot'); else render();
})();
