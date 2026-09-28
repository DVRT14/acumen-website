// List composited layers overlapping a region, with compositing reasons (headed Chrome; headless has no LayerTree).
// node layers.mjs --root <dir> --route /careers/ --vw 1440 [--x 1340 --y 58 --w 30 --h 30]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a, []));
const root = path.resolve(args.root || '../../.baseline/vercel-site');
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch({ headless: false });
const page = await b.newPage({ viewport: { width: +(args.vw || 1440), height: 900 } });
await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
const cdp = await page.context().newCDPSession(page);
await cdp.send('DOM.enable'); await cdp.send('LayerTree.enable');
let layers = [];
cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) layers = e.layers; });
await page.goto(`http://127.0.0.1:${server.address().port}${args.route || '/'}`, { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.mouse.move(5, 5); await page.waitForTimeout(500);
const X = +(args.x ?? 0), Y = +(args.y ?? 0), W = +(args.w ?? 99999), H = +(args.h ?? 99999);
console.log('layers:', layers.length);
for (const l of layers) {
  const x = l.offsetX, y = l.offsetY;
  if (!(x < X + W && x + l.width > X && y < Y + H && y + l.height > Y)) continue;
  let reasons = [];
  try { reasons = (await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId })).compositingReasonIds || []; } catch (e) { reasons = ['?' + e.message.slice(0, 40)]; }
  let name = '';
  if (l.backendNodeId) { try { const d = await cdp.send('DOM.describeNode', { backendNodeId: l.backendNodeId }); name = d.node.localName + '.' + ((d.node.attributes || [])[(d.node.attributes || []).indexOf('class') + 1] || '').slice(0, 70); } catch {} }
  console.log(`[${x},${y} ${l.width}x${l.height}] draws=${l.drawsContent} ${name} :: ${reasons.join(',')}`);
}
await b.close(); server.close();
