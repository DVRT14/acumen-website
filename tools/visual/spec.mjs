// Dump the computed-style "spec" of a subtree, per viewport, to rebuild it without Elementor.
// node spec.mjs --route /contact/ --sel ".elementor-location-header" [--vp 1440,1024,390] [--root ../../.baseline/vercel-site] [--scroll 0]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a, []));
const root = path.resolve(args.root || '../../.baseline/vercel-site');
const vps = (args.vp || '1440,1024,390').split(',').map(Number);

const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) return r.writeHead(404).end();
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(f)];
  r.writeHead(200, t ? { 'Content-Type': t } : {}); fs.createReadStream(f).pipe(r);
}).listen(0);

// Properties worth reproducing; values equal to the browser default for that tag are skipped.
const PROPS = ['display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'box-sizing', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'align-content', 'flex-grow', 'flex-shrink', 'flex-basis', 'gap', 'row-gap', 'column-gap', 'order',
  'grid-template-columns', 'grid-template-rows', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'text-align', 'text-decoration-line', 'white-space', 'color',
  'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius',
  'opacity', 'visibility', 'overflow-x', 'overflow-y', 'transform', 'transition', 'object-fit', 'object-position', 'aspect-ratio', 'fill', 'stroke', 'cursor', 'list-style-type', 'vertical-align'];

const browser = await chromium.launch();
for (const vw of vps) {
  const page = await browser.newPage({ viewport: { width: vw, height: 900 } });
  await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}${args.route}`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  if (args.scroll) { await page.evaluate(y => scrollTo(0, +y), args.scroll); await page.waitForTimeout(1500); }
  // --eval runs JS first, e.g. to open the menu: --eval "document.querySelector('.menuBtn a').click()"
  if (args.eval) { await page.evaluate(args.eval); await page.waitForTimeout(2500); }
  const out = await page.evaluate(({ sel, PROPS }) => {
    const defaults = {};
    const frame = document.createElement('iframe'); document.body.append(frame);
    const def = tag => defaults[tag] ||= (() => { const e = frame.contentDocument.createElement(tag); frame.contentDocument.body.append(e); const cs = getComputedStyle(e); return Object.fromEntries(PROPS.map(p => [p, cs.getPropertyValue(p)])); })();
    const lines = [];
    const walk = (el, depth) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none') { lines.push(`${'  '.repeat(depth)}${el.tagName.toLowerCase()} (display:none) .${[...el.classList].slice(0, 4).join('.')}`); return; }
      const r = el.getBoundingClientRect(), d = def(el.tagName.toLowerCase());
      const pcs = el.parentElement ? getComputedStyle(el.parentElement) : null;
      const INHERITED = /^(font-|color|line-height|letter-spacing|text-(align|transform)|white-space|cursor|list-style|fill|stroke|visibility)/;
      const diff = PROPS.filter(p => {
        const v = cs.getPropertyValue(p);
        if (p === 'width' || p === 'height' || v === d[p]) return false;
        if (INHERITED.test(p) && pcs && pcs.getPropertyValue(p) === v) return false;
        if (p.startsWith('border-') && p !== 'border-radius' && v.startsWith('0px none')) return false;
        if (['top', 'right', 'bottom', 'left'].includes(p) && cs.position === 'relative' && v === '0px') return false;
        return true;
      }).map(p => `${p}:${cs.getPropertyValue(p)}`);
      const cls = [...el.classList].filter(c => !/^elementor-element-[0-9a-f]+$/.test(c)).slice(0, 6).join('.');
      const text = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim().slice(0, 40)).join(' ');
      lines.push(`${'  '.repeat(depth)}${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} [${r.x.toFixed(1)},${(r.y + scrollY).toFixed(1)} ${r.width.toFixed(1)}×${r.height.toFixed(1)}]${text ? ` "${text}"` : ''}`);
      if (diff.length) lines.push(`${'  '.repeat(depth)}  { ${diff.join('; ')} }`);
      [...el.children].forEach(c => walk(c, depth + 1));
    };
    document.querySelectorAll(sel).forEach(el => walk(el, 0));
    frame.remove();
    return lines.join('\n');
  }, { sel: args.sel, PROPS });
  console.log(`\n======== ${args.route} @${vw}\n${out}`);
  await page.close();
}
await browser.close(); server.close();
