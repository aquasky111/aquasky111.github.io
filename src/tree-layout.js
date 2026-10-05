// Pure layout + growth logic (no DOM). Works in the browser (window.TreeLayout) and Node (require).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TreeLayout = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const CX = 400, PER_BRANCH = 3;

  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { // mulberry32: same slug -> same sequence
    let a = seed;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // Growth function: the tree's size is derived from the page count n.
  function growth(n) {
    return {
      step: n <= 20 ? 30 : n <= 60 ? 26 : 22,        // vertical room per leaf
      bare: 90 + 6 * Math.sqrt(n),                   // bare trunk below the first leaf
      reach: Math.min(300, 80 + 22 * Math.sqrt(n)),  // widest branch length
      trunkW: Math.min(34, 8 + 2.2 * Math.sqrt(n)),
      stage: n < 1 ? 'seed' : n < 5 ? 'sapling' : n < 15 ? 'young tree' : n < 30 ? 'growing tree' : 'mature tree',
    };
  }

  // Ground is y = 0, the tree grows toward negative y. Oldest leaf is lowest, newest highest.
  function layout(pages) {
    const items = pages.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.slug < b.slug ? -1 : 1));
    const n = items.length, g = growth(n);

    const leaves = items.map((p, i) => {
      const r = rng(hash(p.slug));
      const b = Math.floor(i / PER_BRANCH), j = i % PER_BRANCH;
      const side = b % 2 === 0 ? -1 : 1;
      const t = n > 1 ? i / (n - 1) : 0;
      const prof = t < 0.3 ? 0.55 + 0.45 * (t / 0.3) : 1 - 0.65 * ((t - 0.3) / 0.7); // canopy outline
      const x = CX + side * (g.reach * prof * [0.4, 0.7, 1][j] + (r() - 0.5) * 8);
      const y = -(g.bare + i * g.step) + (r() - 0.5) * 4;
      const rot = side > 0 ? -30 + (r() - 0.5) * 20 : 210 + (r() - 0.5) * 20;
      return { slug: p.slug, title: p.title, date: p.date, url: p.url || `pages/${p.slug}/`, x, y, rot,
        scale: 0.9 + r() * 0.25, age: t, blossom: r() < 0.18, newest: i === n - 1, delay: r() * 4 };
    });

    const branches = [];
    for (let b = 0; b * PER_BRANCH < n; b++) {
      const grp = leaves.slice(b * PER_BRANCH, b * PER_BRANCH + PER_BRANCH);
      let pts = [[CX, grp[0].y + 18], ...grp.map(l => [l.x, l.y])], d = `M${pts[0][0]},${pts[0][1].toFixed(1)}`;
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay] = pts[k - 1], [bx, by] = pts[k], mx = ax + (bx - ax) * 0.5;
        d += ` C${mx.toFixed(1)},${ay.toFixed(1)} ${mx.toFixed(1)},${by.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
      }
      branches.push({ d, w: Math.max(1.5, 4 - b * 0.05) });
    }

    const topY = n ? leaves[n - 1].y - 36 : -70;
    const w = g.trunkW;
    const trunk = `M${CX - w / 2},0 C${CX - w / 2},${topY * 0.4} ${CX - 1.2},${topY * 0.6} ${CX - 1.2},${topY} ` +
      `L${CX + 1.2},${topY} C${CX + 1.2},${topY * 0.6} ${CX + w / 2},${topY * 0.4} ${CX + w / 2},0Z`;

    const half = Math.max(g.reach + 60, 140);
    const top = topY - 150;
    return { stage: g.stage, n, trunk, branches, leaves, half,
      viewBox: [CX - half, top, half * 2, -top + 40] };
  }

  return { growth, layout, hash, rng };
});
