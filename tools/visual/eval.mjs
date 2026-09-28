// Evaluate a JS expression on a page after load. node eval.mjs <root> <route> <expr> [vw]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [rootArg, route, expr, vwArg] = process.argv.slice(2); const root = path.resolve(rootArg);
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: +(vwArg || 1440), height: 900 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}${route}`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
console.log(await page.evaluate(expr));
await b.close(); server.close();
