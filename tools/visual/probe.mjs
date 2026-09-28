// Follow capture.mjs's exact steps up to a tile, then evaluate an expression (and save the screenshot).
// node probe.mjs --root <dir> --route / --vw 1440 --tile 8 --expr "..." [--out shot.png]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a, []));
const root = path.resolve(args.root), vw = +args.vw, vh = vw >= 1024 ? 900 : vw >= 768 ? 1024 : 844;
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r);
}).listen(0);

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
await page.addInitScript(() => { let x = 42; Math.random = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); });
const advance = async ms => { for (let t = 0; t < ms; t += 100) await page.clock.fastForward(100); };
await page.goto(`http://127.0.0.1:${server.address().port}${args.route}`, { waitUntil: 'load' });
await advance(4000);
for (let i = 0; i <= +args.tile; i++) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), i * vh);
  await page.waitForTimeout(100);
  await advance(4000);
}
if (args.extra) await advance(+args.extra);
if (args.expr) console.log(await page.evaluate(args.expr));
if (args.out) await page.screenshot({ path: args.out });
await browser.close(); server.close();
