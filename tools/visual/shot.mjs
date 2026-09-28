// Screenshot a page state. node shot.mjs --root <dir> --route /contact/ --vw 1440 --out file.png [--eval "js"] [--hover "selector"] [--scroll y]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a, []));
const root = path.resolve(args.root || '../../.baseline/vercel-site');
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch(); const vw = +(args.vw || 1440);
const page = await b.newPage({ viewport: { width: vw, height: vw >= 1024 ? 900 : vw >= 768 ? 1024 : 844 } });
await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}${args.route}`, { waitUntil: 'load' }); await page.waitForTimeout(2000);
await page.addStyleTag({ content: '.cky-consent-container,.cky-btn-revisit-wrapper,[data-consent-ui]{display:none!important}' });
if (args.scroll) { await page.evaluate(y => scrollTo(0, +y), args.scroll); await page.waitForTimeout(1500); }
if (args.eval) { await page.evaluate(args.eval); await page.waitForTimeout(2500); }
if (args.hover) { await page.hover(args.hover); await page.waitForTimeout(1000); }
await page.screenshot({ path: args.out }); await b.close(); server.close();
