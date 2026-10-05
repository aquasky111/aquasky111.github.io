import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { layout } = createRequire(import.meta.url)('../src/tree-layout.js');

const make = n => Array.from({ length: n }, (_, i) => ({
  slug: `page-${i}`, title: `Page ${i}`, date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
}));

for (const n of [0, 1, 10, 50, 200]) {
  test(`layout is valid and ordered at ${n} pages`, () => {
    const pages = make(n), L = layout(pages.slice().reverse()); // input order must not matter
    assert.equal(L.leaves.length, n);
    L.leaves.forEach((l, i) => {
      assert.equal(l.slug, pages[i].slug);                           // sorted by date
      if (i) assert.ok(l.y < L.leaves[i - 1].y, 'newer leaf is higher'); // bottom to top
      assert.ok(l.x > L.viewBox[0] && l.x < L.viewBox[0] + L.viewBox[2], 'inside viewBox');
    });
    assert.deepEqual(layout(pages), layout(pages.slice().reverse())); // deterministic
  });
}
