(async function () {
  const svg = document.getElementById('tree'), tip = document.getElementById('tip');
  let pages;
  try { pages = await (await fetch('pages.json')).json(); } catch (e) { return; }
  const T = window.TreeLayout.layout(pages);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LEAF = 'M0,0 C7,-9 20,-8 27,0 C20,8 7,9 0,0Z';

  svg.setAttribute('viewBox', T.viewBox.map(v => v.toFixed(0)).join(' '));
  const [vx, , vw] = T.viewBox;
  svg.innerHTML =
    `<ellipse cx="400" cy="14" rx="${T.half}" ry="26" fill="var(--grass)"/>` +
    `<path d="${T.trunk}" fill="var(--bark)"/>` +
    T.branches.map(b => `<path d="${b.d}" fill="none" stroke="var(--bark)" stroke-width="${b.w.toFixed(1)}" stroke-linecap="round"/>`).join('') +
    T.leaves.map(l => {
      const cls = 'leaf-shape ' + (l.blossom ? 'bloom' : 'g' + Math.min(3, Math.floor(l.age * 4))) + (l.newest ? ' newest' : '');
      return `<a href="${l.url}" class="leaf" aria-label="${esc(l.title)}, ${l.date}" data-title="${esc(l.title)}" data-date="${l.date}">` +
        `<g transform="translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${l.scale.toFixed(2)})">` +
        `<circle cx="13" r="24" fill="transparent"/>` +
        `<path class="${cls}" d="${LEAF}" style="animation-delay:-${l.delay.toFixed(1)}s"/></g></a>`;
    }).join('');

  document.getElementById('stage').textContent =
    T.n ? `A ${T.stage} with ${T.n} ${T.n === 1 ? 'leaf' : 'leaves'}` : 'A seed, waiting for its first page';
  document.querySelector('.all-pages')?.removeAttribute('open');

  const show = e => {
    const a = e.target.closest?.('a.leaf'); if (!a) return;
    const r = a.getBoundingClientRect();
    tip.innerHTML = `<strong>${a.dataset.title}</strong><span>${a.dataset.date}</span>`;
    tip.style.left = Math.min(innerWidth - 12, Math.max(12, r.left + r.width / 2)) + 'px';
    tip.style.top = r.top - 8 + 'px'; tip.hidden = false;
  };
  const hide = () => { tip.hidden = true; };
  svg.addEventListener('pointerover', show); svg.addEventListener('focusin', show);
  svg.addEventListener('pointerout', hide); svg.addEventListener('focusout', hide);

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const box = document.querySelector('.petals');
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('i');
      p.style.cssText = `left:${Math.random() * 100}%;animation-duration:${9 + Math.random() * 8}s;animation-delay:-${Math.random() * 16}s`;
      box.appendChild(p);
    }
  }
})();
