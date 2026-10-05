// Reads content/*.md -> validates front matter -> writes dist/ (site + pages.json + page HTML)
import { readdir, readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const errors = [], pages = [];

const files = (await readdir('content')).filter(f => f.endsWith('.md') && !f.startsWith('_'));
for (const f of files) {
  const { data, content } = matter(await readFile(path.join('content', f), 'utf8'));
  if (data.draft === true) continue;
  const slug = f.slice(0, -3);
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? '');
  if (typeof data.title !== 'string' || !data.title.trim()) errors.push(`${f}: missing "title"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) errors.push(`${f}: "date" must be YYYY-MM-DD (got "${date}")`);
  pages.push({ slug, title: data.title, date, summary: data.summary ?? '', tags: data.tags ?? [], url: `pages/${slug}/`, html: marked.parse(content) });
}
if (errors.length) { console.error('Build failed:\n  ' + errors.join('\n  ')); process.exit(1); }

pages.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.slug < b.slug ? -1 : 1)); // oldest first

await rm('dist', { recursive: true, force: true });
await cp('src', 'dist', { recursive: true });
await writeFile('dist/pages.json', JSON.stringify(pages.map(({ html, ...p }) => p), null, 2));

const pageHtml = p => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.summary)}">
<link rel="stylesheet" href="../../style.css"></head>
<body class="page"><main class="article">
<a class="back" href="../../">Back to the tree</a>
<h1>${esc(p.title)}</h1>
<p class="date"><time datetime="${p.date}">${p.date}</time></p>
${p.html}
</main></body></html>`;
for (const p of pages) {
  await mkdir(`dist/pages/${p.slug}`, { recursive: true });
  await writeFile(`dist/pages/${p.slug}/index.html`, pageHtml(p));
}

const list = [...pages].reverse()
  .map(p => `<li><a href="${p.url}">${esc(p.title)}</a> <time>${p.date}</time></li>`).join('\n');
const index = (await readFile('src/index.html', 'utf8'))
  .replace('<!--LIST-->', list).replace('<!--COUNT-->', String(pages.length));
await writeFile('dist/index.html', index);
console.log(`Built ${pages.length} page(s).`);
