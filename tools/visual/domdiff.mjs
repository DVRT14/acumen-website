// Report DOM mutations made by scripts: class/attr/style changes and inserted elements, grouped.
// node domdiff.mjs --root <dir> --pages /,contact --vw 1440
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a, []));
const root = path.resolve(args.root);
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); let f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r); }).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
for (const route of args.pages.split(',')) {
  const page = await browser.newPage({ viewport: { width: +(args.vw || 1440), height: 900 } });
  await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
  const src = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
  await page.goto(base + route, { waitUntil: 'load' });
  // scroll through so scroll-driven code runs, then back to top
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 700) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(120); }
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1500);
  const res = await page.evaluate(src => {
    const doc = new DOMParser().parseFromString(src, 'text/html');
    const pathOf = el => { const p = []; for (; el && el.nodeType === 1 && el.tagName !== 'HTML'; el = el.parentElement) p.unshift(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')); return p.join('>'); };
    const sig = el => el.tagName.toLowerCase() + '.' + [...el.classList].filter(c => !/^elementor-element-[0-9a-f]+$/.test(c)).slice(0, 4).join('.');
    const out = { added: {}, classAdd: {}, classDel: {}, attr: {}, style: {} };
    const inc = (o, k) => o[k] = (o[k] || 0) + 1;
    // Match elements by data-id / id / position among same-tag siblings.
    const walk = (a, b) => { // a = live, b = source
      if (a.tagName !== b.tagName) return;
      const ca = [...a.classList], cb = [...b.classList];
      ca.filter(c => !cb.includes(c)).forEach(c => inc(out.classAdd, `${sig(b)} +${c}`));
      cb.filter(c => !ca.includes(c)).forEach(c => inc(out.classDel, `${sig(b)} -${c}`));
      for (const at of a.attributes) if (!['class', 'style'].includes(at.name) && b.getAttribute(at.name) !== at.value) inc(out.attr, `${sig(b)} [${at.name}]${b.hasAttribute(at.name) ? ' changed' : ' added'}`);
      for (const at of b.attributes) if (!a.hasAttribute(at.name)) inc(out.attr, `${sig(b)} [${at.name}] removed`);
      if ((a.getAttribute('style') || '') !== (b.getAttribute('style') || '')) inc(out.style, `${sig(b)} style=${(a.getAttribute('style') || '').replace(/[\d.-]+(px|%|deg)?/g, 'N').slice(0, 90)}`);
      const kb = [...b.children], ka = [...a.children];
      let j = 0;
      for (const x of ka) {
        const k = y => `${y.tagName}#${y.id}|${y.dataset.id || ''}|${y.classList[0] || ''}`;
        const m = kb.slice(j).findIndex(y => k(y) === k(x));
        if (m < 0) { inc(out.added, `${sig(a)} > ${sig(x)}`); continue; }
        walk(x, kb[j + m]); j += m + 1;
      }
    };
    walk(document.documentElement, doc.documentElement);
    return out;
  }, src);
  console.log(`\n######## ${route}`);
  for (const [k, o] of Object.entries(res)) { const e = Object.entries(o); if (!e.length) continue; console.log(`-- ${k}`); e.sort((a, b) => b[1] - a[1]).slice(0, 60).forEach(([s, n]) => console.log(`  ${n}× ${s}`)); }
  await page.close();
}
await browser.close(); server.close();
