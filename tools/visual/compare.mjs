// Compare two capture dirs tile by tile (pixels + layout). Writes out/report.html.
// node compare.mjs --a out/baseline --b out/candidate [--allow allow.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) =>
  v.startsWith('--') ? [...a, [v.slice(2), all[i + 1] ?? true]] : a, []));
const A = path.resolve(here, args.a || 'out/baseline');
const B = path.resolve(here, args.b || 'out/candidate');
const reportDir = path.resolve(here, args.report || 'out/report');
// allow.json: [{ "page": "home", "vw": 390, "tile": "tile-06", "reason": "…" }] — vw/tile optional.
const allow = args.allow && fs.existsSync(path.resolve(here, args.allow))
  ? JSON.parse(fs.readFileSync(path.resolve(here, args.allow), 'utf8')) : [];
//             { "text": "regex", "page": "regex", "reason": "…" } — ignores that text's layout and its rows
//             of pixels (continuously animated things whose phase is not reproducible).
const allowed = (page, vw, tile) => allow.find(a => !a.text && a.page === page && (!a.vw || a.vw === +vw) && (!a.tile || a.tile === tile));
//             { "prefixOf": ["typed text"] } — the same for any partly typed state of that text (typed.js).
const norm = t => t.replace(/\s+/g, ' ').trim();
const animated = page => allow.filter(a => (a.text || a.prefixOf) && (!a.page || new RegExp(a.page).test(page))).map(a => a.text
  ? new RegExp(a.text)
  : { test: t => !!norm(t) && a.prefixOf.some(p => norm(p).startsWith(norm(t))) });
function maskAnimated(page, la, lb, ia, ib) {
  const res = animated(page);
  if (!res.length) return [la, lb];
  const hit = i => res.some(r => r.test(i.k.slice(2).replace(/#\d+$/, '')));
  for (const i of [...la, ...lb].filter(hit)) {
    for (let y = Math.max(0, Math.floor(i.y) - 8); y < Math.min(ia.height, Math.ceil(i.y + i.h) + 8); y++) { // + glyph overhang
      ia.data.copy(ib.data, y * ia.width * 4, y * ia.width * 4, (y + 1) * ia.width * 4);
    }
  }
  return [la.filter(i => !hit(i)), lb.filter(i => !hit(i))];
}
const TRACKERS = /googletagmanager|google-analytics|licdn|linkedin|leadinfo|doubleclick/;
const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));

fs.rmSync(reportDir, { recursive: true, force: true });
fs.mkdirSync(reportDir, { recursive: true });

function layoutDiff(a, b) {
  const mb = new Map(b.map(i => [i.k, i])), out = [];
  for (const i of a) {
    const j = mb.get(i.k);
    if (!j) { out.push(`missing ${i.k}`); continue; }
    mb.delete(i.k);
    const d = ['x', 'y', 'w', 'h'].filter(p => Math.abs(i[p] - j[p]) > 0.5);
    if (d.length) out.push(`moved ${i.k} ${d.map(p => `${p}:${i[p]}→${j[p]}`).join(' ')}`);
    if (i.font !== j.font) out.push(`font ${i.k} ${i.font} → ${j.font}`);
    if (i.color !== j.color) out.push(`color ${i.k} ${i.color} → ${j.color}`);
  }
  for (const k of mb.keys()) out.push(`extra ${k}`);
  return out;
}

const rows = [];
let fails = 0, accepted = 0, checked = 0;
for (const page of fs.readdirSync(A).filter(d => fs.statSync(path.join(A, d)).isDirectory()).sort()) {
  for (const vw of fs.readdirSync(path.join(A, page))) {
    const da = path.join(A, page, vw), db = path.join(B, page, vw);
    if (!fs.existsSync(path.join(db, 'page.json'))) continue;
    const ra = readJSON(path.join(da, 'page.json')), rb = readJSON(path.join(db, 'page.json'));
    const problems = [];
    if (ra.docHeight !== rb.docHeight) problems.push(`docHeight ${ra.docHeight} → ${rb.docHeight}`);
    const errs = rb.errors.filter(e => !e.includes('net::ERR_FAILED'));
    if (errs.length) problems.push(`console: ${errs.slice(0, 3).join(' | ')}`);
    if (rb.failed.length) problems.push(`failed: ${rb.failed.slice(0, 3).join(' | ')}`);
    const tracked = Object.keys(rb.external).filter(h => TRACKERS.test(h));
    if (args.consent === 'denied' && tracked.length) problems.push(`trackers before consent: ${tracked.join(', ')}`);
    const tiles = [];
    for (const t of ra.tiles) {
      checked++;
      const fb = path.join(db, t.name + '.png');
      if (!fs.existsSync(fb)) { tiles.push({ t: t.name, msg: 'missing tile' }); continue; }
      const ia = PNG.sync.read(fs.readFileSync(path.join(da, t.name + '.png')));
      const ib = PNG.sync.read(fs.readFileSync(fb));
      if (ia.width !== ib.width || ia.height !== ib.height) { tiles.push({ t: t.name, msg: 'size differs' }); continue; }
      const [la, lb] = maskAnimated(page, readJSON(path.join(da, t.name + '.json')), readJSON(path.join(db, t.name + '.json')), ia, ib);
      const diff = new PNG({ width: ia.width, height: ia.height });
      const n = pixelmatch(ia.data, ib.data, diff.data, ia.width, ia.height, { threshold: 0.1 });
      const lay = layoutDiff(la, lb);
      if (!n && !lay.length) continue;
      const id = `${page}_${vw}_${t.name}`;
      fs.copyFileSync(path.join(da, t.name + '.png'), path.join(reportDir, id + '_a.png'));
      fs.copyFileSync(fb, path.join(reportDir, id + '_b.png'));
      fs.writeFileSync(path.join(reportDir, id + '_d.png'), PNG.sync.write(diff));
      tiles.push({ t: t.name, id, n, lay, unstable: !t.stable });
    }
    for (const x of [...tiles, ...problems.map(p => ({ msg: p }))]) {
      const ok = allowed(page, vw, x.t);
      ok ? accepted++ : fails++;
      rows.push({ page, vw, ...x, ok: ok?.reason });
    }
  }
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
fs.writeFileSync(path.join(reportDir, 'index.html'), `<!doctype html><meta charset=utf-8><title>Visual diff</title>
<style>body{font:13px system-ui;margin:16px}section{border-top:1px solid #ccc;padding:8px 0}img{width:32%;border:1px solid #ddd}
.ok{opacity:.5}pre{white-space:pre-wrap;font-size:11px;max-height:160px;overflow:auto}</style>
<h1>${fails} failing, ${accepted} accepted, ${checked} tiles checked</h1>
${rows.map(r => `<section class="${r.ok ? 'ok' : ''}"><b>${r.page} @${r.vw} ${r.t || ''}</b> ${r.n ? r.n + ' px' : ''}
${r.unstable ? '(baseline tile unstable)' : ''} ${r.ok ? '— accepted: ' + esc(r.ok) : ''} ${r.msg ? esc(r.msg) : ''}
${r.lay?.length ? `<pre>${esc(r.lay.slice(0, 40).join('\n'))}</pre>` : ''}
${r.id ? `<div><img src="${r.id}_a.png"><img src="${r.id}_b.png"><img src="${r.id}_d.png"></div>` : ''}</section>`).join('')}`);
console.log(`${fails} failing, ${accepted} accepted, ${checked} tiles checked → ${path.relative(process.cwd(), reportDir)}/index.html`);
for (const r of rows.filter(r => !r.ok).slice(0, 30)) console.log(`  ${r.page} @${r.vw} ${r.t || ''} ${r.n ? r.n + 'px' : ''} ${r.lay?.length ? r.lay.length + ' layout' : ''} ${r.msg || ''}`);
process.exitCode = fails ? 1 : 0;
