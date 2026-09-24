// Capture viewport tiles + layout for every page of a static site.
// node capture.mjs --root ../../vercel-site --out out/candidate [--pages knowledge,contact] [--vp 1440,390] [--workers 4]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) =>
  v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]] : a, []));
const root = path.resolve(args.root || path.join(here, '../../vercel-site'));
const out = path.resolve(here, args.out || 'out/candidate');
const viewports = String(args.vp || '1920,1440,1366,1025,1024,768,767,390').split(',').map(Number);
const workers = Number(args.workers || 4);
const filter = args.pages ? String(args.pages).split(',') : null;
const pages = JSON.parse(fs.readFileSync(path.join(here, '../../docs/pages.json'), 'utf8'))
  .filter(p => !filter || filter.some(f => f === '/' ? p === '/' : p.includes(f)));

// Things that never stop moving. Motion is reviewed separately; here we only compare layout.
// New markup should tag such elements with data-vr-mask.
const MASK_CSS = `
video, [wb-data="marquee"], .typed, .typedContainer, .elementor-widget-lottie, .scrollingText,
.sectionDataGroup__bgImg, .expand-section .bgImage, [data-vr-mask],
.cky-consent-container, .cky-btn-revisit-wrapper, .cky-overlay, .cky-modal, [data-consent-ui]
{ visibility: hidden !important; }`;

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };

function serve(dir) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(dir, p);
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!p.endsWith('/')) { res.writeHead(308, { Location: p + '/' }).end(); return; }
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// Runs in the page: visible text nodes and images inside the viewport, keyed so they survive markup changes.
function collectLayout() {
  const vh = innerHeight, vw = innerWidth, seen = {}, items = [];
  const key = k => { seen[k] = (seen[k] || 0) + 1; return `${k}#${seen[k]}`; };
  const visible = el => el.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) ?? true;
  const push = (k, r, el) => {
    if (!r || r.width === 0 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
    const cs = getComputedStyle(el);
    items.push({ k: key(k), x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      font: `${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.split(',')[0]}`, color: cs.color });
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t || !n.parentElement || !visible(n.parentElement)) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    push('t:' + t.slice(0, 60), range.getBoundingClientRect(), n.parentElement);
  }
  for (const img of document.images) {
    if (!visible(img)) continue;
    push('img:' + (img.currentSrc || img.src).split('/').pop().split('?')[0], img.getBoundingClientRect(), img);
  }
  return items;
}

async function waitStable(page, maxMs = 3000) {
  let prev = await page.screenshot({ caret: 'hide' });
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await page.waitForTimeout(150);
    const cur = await page.screenshot({ caret: 'hide' });
    if (cur.equals(prev)) return { png: cur, stable: true };
    prev = cur;
  }
  return { png: prev, stable: false };
}

async function captureOne(browser, base, route, vw) {
  const slug = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '__');
  const dir = path.join(out, slug, String(vw));
  if (args.resume && fs.existsSync(path.join(dir, 'page.json'))) return JSON.parse(fs.readFileSync(path.join(dir, 'page.json'), 'utf8'));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const vh = vw >= 1024 ? 900 : vw >= 768 ? 1024 : 844;
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const report = { route, vw, vh, errors: [], failed: [], external: {}, tiles: [] };
  // Aborted third-party requests show up as ERR_FAILED console errors; local failures are tracked via responses.
  page.on('console', m => m.type() === 'error' && !m.text().includes('net::ERR_FAILED') && report.errors.push(m.text()));
  page.on('pageerror', e => report.errors.push(String(e)));
  await page.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname === '127.0.0.1') return r.continue();
    report.external[u.hostname] = (report.external[u.hostname] || 0) + 1;
    return r.abort();
  });
  page.on('response', r => r.status() >= 400 && r.url().includes('127.0.0.1') && report.failed.push(`${r.status()} ${r.url()}`));

  await page.goto(base + route, { waitUntil: 'load' });
  await page.addStyleTag({ content: MASK_CSS });
  for (let i = 0, y = 0; ; i++, y += vh) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
    const { png, stable } = await waitStable(page);
    const scrollY = await page.evaluate(() => scrollY);
    const name = `tile-${String(i).padStart(2, '0')}`;
    fs.writeFileSync(path.join(dir, name + '.png'), png);
    fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(await page.evaluate(collectLayout)));
    report.tiles.push({ name, y, scrollY, stable });
    const docH = await page.evaluate(() => document.documentElement.scrollHeight);
    if (y + vh >= docH || i > 60) { report.docHeight = docH; break; }
  }
  fs.writeFileSync(path.join(dir, 'page.json'), JSON.stringify(report, null, 1));
  await ctx.close();
  return report;
}

const server = await serve(root);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const jobs = pages.flatMap(p => viewports.map(v => [p, v]));
let done = 0;
await Promise.all(Array.from({ length: workers }, async () => {
  for (let job; (job = jobs.shift());) {
    try {
      const r = await captureOne(browser, base, ...job);
      const warn = [r.errors.length && `${r.errors.length} errors`, r.failed.length && `${r.failed.length} failed`,
        r.tiles.some(t => !t.stable) && 'unstable'].filter(Boolean).join(', ');
      console.log(`[${++done}] ${job[0]} @${job[1]} ${r.tiles.length} tiles ${warn}`);
    } catch (e) { console.log(`[${++done}] ${job[0]} @${job[1]} FAILED ${e.message}`); }
  }
}));
await browser.close();
server.close();
