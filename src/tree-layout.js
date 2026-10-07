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
      trunkW: Math.min(30, 7 + 1.8 * Math.sqrt(n)),
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
        scale: 1.05 + r() * 0.2, age: t, blossom: r() < 0.18, newest: i === n - 1, delay: r() * 4 };
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
    return { stage: g.stage, n, trunk, topY, mound: { rx: Math.min(half - 10, 90 + 8 * Math.sqrt(n)) }, branches, leaves, half,
      viewBox: [CX - half, top, half * 2, -top + 40] };
  }

  const BODY = 'M0,0 C5,-11 21,-13 33,0 C21,13 5,11 0,0Z';
  const VEIN = 'M1,0 L29,0 M9,0 L16,-6 M9,0 L16,6 M17,0 L23,-4.5 M17,0 L23,4.5';
  const SHINE = 'M5,-2.5 C11,-8 19,-9 25,-5.5';
  const parts = cls => `<path class="body ${cls}" d="${BODY}"/><path class="vein" d="${VEIN}"/><path class="shine" d="${SHINE}"/>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(${a})"/><stop offset="1" style="stop-color:var(${b})"/></linearGradient>`;

  // Turns a layout into SVG markup: soil mound, grass, trunk, branches, glossy leaves.
  function toSVG(T) {
    const rx = T.mound.rx, r = rng(hash('mound'));
    const surf = dx => -10 + 50 * Math.pow(Math.min(1, Math.abs(dx) / rx), 1.6);
    const tuft = (dx, k) => { const x = CX + dx, y = surf(dx) + 2;
      return `<path d="M${x},${y} q-3,-8 ${-8 * k},${-13 * k} M${x},${y} q1,-10 2,${-16 * k} M${x},${y} q4,-7 ${9 * k},${-11 * k}" class="blade"/>`; };
    let s = '<defs>' + [0, 1, 2, 3].map(k => grad('lg' + k, `--g${k}a`, `--g${k}b`)).join('') +
      grad('lgb', '--bloom-a', '--bloom-b') + grad('soil', '--soil1', '--soil2') + '</defs>';
    s += `<ellipse cx="${CX}" cy="14" rx="${T.half}" ry="26" style="fill:var(--grass)"/>`;
    s += `<path d="${T.trunk}" style="fill:var(--bark)"/>`;
    s += `<path d="M${CX - rx},40 C${CX - rx * 0.55},40 ${CX - rx * 0.35},-10 ${CX},-10 C${CX + rx * 0.35},-10 ${CX + rx * 0.55},40 ${CX + rx},40Z" fill="url(#soil)"/>`;
    for (let i = 0; i < 9; i++) { const dx = (r() * 1.5 - 0.75) * rx, y = surf(dx) + 8 + r() * 14;
      s += `<ellipse cx="${(CX + dx).toFixed(1)}" cy="${y.toFixed(1)}" rx="${(2.5 + r() * 2.5).toFixed(1)}" ry="${(1.8 + r() * 1.4).toFixed(1)}" style="fill:var(--soil3)"/>`; }
    s += [-0.7, -0.5, -0.28, 0.28, 0.5, 0.72].map((f, i) => tuft(f * rx, 0.8 + (i % 3) * 0.2)).join('');
    s += T.branches.map(b => `<path d="${b.d}" fill="none" stroke-width="${b.w.toFixed(1)}" stroke-linecap="round" style="stroke:var(--bark)"/>`).join('');
    s += `<g transform="translate(${CX} ${(T.topY + 6).toFixed(0)}) rotate(-90) scale(1.35)"><g class="sway">${parts('g3')}</g></g>`;
    s += T.leaves.map(l => {
      const cls = (l.blossom ? 'bloom' : 'g' + Math.min(3, Math.floor(l.age * 4))) + (l.newest ? ' newest' : '');
      return `<a href="${l.url}" class="leaf" aria-label="${esc(l.title)}, ${l.date}" data-title="${esc(l.title)}" data-date="${l.date}">` +
        `<g transform="translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${l.scale.toFixed(2)})">` +
        `<circle cx="16" r="24" fill="transparent"/><g class="sway" style="animation-delay:-${l.delay.toFixed(1)}s">${parts(cls)}</g></g></a>`;
    }).join('');
    return s;
  }

  return { growth, layout, toSVG, hash, rng };
});
