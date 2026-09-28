// Ancestor chain of an element with compositing-relevant styles. node anc.mjs <root> <route> <selector> [vw]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [rootArg, route, sel, vwArg] = process.argv.slice(2); const root = path.resolve(rootArg);
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: +(vwArg || 1440), height: 900 } });
await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}${route}`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
const P = ['position','z-index','overflow-x','overflow-y','transform','will-change','opacity','filter','isolation','contain','border-radius','background-color','background-image','mix-blend-mode','backface-visibility','clip-path','mask-image','text-rendering','-webkit-font-smoothing','font-family','color'];
console.log(await page.evaluate(({ sel, P }) => { const out = []; for (let e = document.querySelector(sel); e && e.nodeType === 1; e = e.parentElement) {
  const c = getComputedStyle(e); out.push(e.tagName.toLowerCase() + '.' + [...e.classList].slice(0, 3).join('.') + ' :: ' + P.map(p => { const v = c.getPropertyValue(p); return ['auto','none','visible','normal','static','0px','rgba(0, 0, 0, 0)','1'].includes(v) ? '' : p + '=' + v.slice(0, 60); }).filter(Boolean).join(' ')); } return out.join('\n'); }, { sel, P }));
await b.close(); server.close();
