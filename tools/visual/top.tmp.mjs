import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(process.argv[2]);
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 390, height: 844 } });
await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
console.log(await page.evaluate(() => {
  const w = document.querySelector('.elementor-location-header, .masthead'), c = document.querySelector('[data-elementor-type="wp-page"]');
  const kids = [...w.children].map(k => `${k.className.slice(0, 50)} disp=${getComputedStyle(k).display} pos=${getComputedStyle(k).position} h=${k.getBoundingClientRect().height.toFixed(2)}`);
  return `wrapper h=${w.getBoundingClientRect().height} style=${w.getAttribute('style')} content top=${c.getBoundingClientRect().top + scrollY}\n  ` + kids.join('\n  ');
}));
await b.close(); server.close();
