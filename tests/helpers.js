const crypto = require('node:crypto');
const { seedDb } = require('../src/seed.js');
const clone = o => JSON.parse(JSON.stringify(o));

function memStore(seed) {
  const st = { t: 1e12 };
  const hash = s => crypto.createHash('sha256').update('salt' + s).digest('hex');
  let db = clone(seed || seedDb(hash));
  return {
    load: () => clone(db),
    save: (d, ch) => { for (const k of ch) db[k] = clone(d[k]); },
    hash, now: () => st.t, uuid: () => crypto.randomUUID(), lock: fn => fn(),
    tick: ms => { st.t += ms; }, raw: () => db
  };
}
module.exports = { memStore, clone };
