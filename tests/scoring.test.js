const assert = require('node:assert/strict');
const S = require('../src/scoring.js');
const C = S.DEFAULT_CONFIG;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
const fives = n => Array(n).fill(5);

// spec §7 example: SPEC → 85.6 B
{
  const r = S.score(C, 'SPEC', [{ w: 50, p: 90 }, { w: 25, p: 80 }],
    { i: [90, 80], iii: [4, 4, 4, 4, 4, 4], iv: [5, 5, 5] },
    { q: [4, 4, 4, 4, 4], s: [5, 5] }, [{ q: [3, 3, 3, 3, 3] }], []);
  near(r.I, 65); near(r.II, 5.6); near(r.III, 12); near(r.IV, 3);
  assert.equal(r.total, 85.6); assert.equal(r.grade, 'B'); assert.equal(r.complete, true);
  assert.equal(r.redistributed, false);
}

// HEAD_DEPT with no peer answers → peer weight redistributed
{
  const r = S.score(C, 'HEAD_DEPT', [{ w: 60, p: 100 }],
    { i: [100], iii: fives(6), iv: fives(3) },
    { q: [4, 4, 4, 4, 4, 4], s: [5, 5] }, [], [{ q: [3, 3, 3, 3, 3, 3] }]);
  near(r.parts.sup, 80); near(r.parts.sub, 60); near(r.parts.sac, 100);
  assert.equal(r.parts.peer, null); assert.equal(r.redistributed, true);
  near(r.II, (80 * 50 + 60 * 30 + 100 * 10) / 90 * 20 / 100);
  assert.ok(r.total <= 100);
}

// rounding boundary
assert.equal(S.round1(94.95), 95); assert.equal(S.grade(95), 'A');
assert.equal(S.grade(94.9), 'B'); assert.equal(S.grade(85), 'B'); assert.equal(S.grade(84.9), 'C');
assert.equal(S.grade(75), 'C'); assert.equal(S.grade(65), 'D'); assert.equal(S.grade(64.9), 'E');

// f1 missing → incomplete
{
  const r = S.score(C, 'SPEC', [{ w: 75, p: 100 }], null, { q: fives(5), s: [5, 5] }, [], []);
  assert.equal(r.complete, false); assert.equal(r.total, null); assert.equal(r.grade, null);
}

// SERVICE all max = 100 (IV weight 0, no iv answers needed)
{
  const g = C.groups.SERVICE;
  const r = S.score(C, 'SERVICE', [{ w: 80, p: 100 }], { i: [100], iii: fives(g.iii.length), iv: [] },
    { q: fives(5), s: [5, 5] }, [{ q: fives(5) }], []);
  assert.equal(r.total, 100); assert.equal(r.grade, 'A');
}

// config validation
assert.deepEqual(S.validateConfig(C), []);
{
  const bad = JSON.parse(JSON.stringify(C)); bad.groups.SPEC.w = [75, 7, 15, 2];
  assert.equal(S.validateConfig(bad).length, 1);
}
for (const [k, g] of Object.entries(C.groups)) {
  assert.equal(g.w.reduce((a, b) => a + b, 0), 100, k);
  assert.equal(Object.values(g.split).reduce((a, b) => a + b, 0), 100, k);
}
assert.equal(S.hasSub(C, 'HEAD_DEPT'), true); assert.equal(S.hasSub(C, 'HEAD_SEC'), true);
assert.equal(S.hasSub(C, 'SPEC'), false); assert.equal(S.hasSub(C, 'AUDIT'), false);
assert.equal(S.pct15([5, 3]), 80);
console.log('scoring: all passed');
