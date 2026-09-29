// Submit a page's form against a static build (no /api/forms there, so the request fails) and print
// the feedback message the form shows. node formcheck.mjs --root <dist> --route /contact/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a, []));
const root = path.resolve(args.root);
const server = http.createServer((q, r) => {
  let f = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r);
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}${args.route}`, { waitUntil: 'load' });
await page.waitForTimeout(1500);
for (const input of await page.$$('form[data-form] input[type=file]')) await input.setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
const out = await page.evaluate(async () => {
  const form = document.querySelector('form[data-form]');
  if (!form) return 'no form[data-form] on page';
  form.querySelectorAll('input:not([type=hidden]):not([type=file]), textarea').forEach(i => { i.value = i.type === 'email' ? 'a@b.be' : 'x'; });
  form.querySelector('[type="submit"]').click();
  for (let i = 0; i < 50 && !form.querySelector('.form-message'); i++) await new Promise(r => setTimeout(r, 100));
  const m = form.querySelector('.form-message');
  if (!m) return 'no message after submit';
  const cs = getComputedStyle(m);
  return { class: m.className, text: m.textContent, color: cs.color, margin: cs.margin, lineHeight: cs.lineHeight, waiting: form.classList.contains('form-waiting') };
});
console.log(args.route, JSON.stringify(out));
await browser.close(); server.close();
