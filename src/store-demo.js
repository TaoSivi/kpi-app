// Store ໂໝດທົດລອງ: ເກັບໃນ localStorage ຂອງເຄື່ອງນີ້ເທົ່ານັ້ນ
const DEMO_KEY = 'kpi_demo_v1';
function makeDemoStore() {
  // shortcut: djb2 hash is weak — demo data only (fake names, PIN 1234); real data uses SHA-256 in Apps Script
  const hash = s => { let h = 5381; for (const ch of 'demo' + s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; return h.toString(16); };
  const uuid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  return {
    load() {
      try { const s = localStorage.getItem(DEMO_KEY); if (s) return JSON.parse(s); } catch (e) { /* ໃຊ້ seed */ }
      return seedDb(hash);
    },
    save(db) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); } catch (e) { /* private mode */ } },
    hash, uuid, now: () => Date.now(), lock: fn => fn(),
    reset() { try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* ignore */ } }
  };
}
