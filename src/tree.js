(async function () {
  const svg = document.getElementById('tree'), tip = document.getElementById('tip');
  let pages;
  try { pages = await (await fetch('pages.json')).json(); } catch (e) { return; }
  const T = window.TreeLayout.layout(pages);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  svg.setAttribute('viewBox', T.viewBox.map(v => v.toFixed(0)).join(' '));
  svg.innerHTML = window.TreeLayout.toSVG(T);

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
