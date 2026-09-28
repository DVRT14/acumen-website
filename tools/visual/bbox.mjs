// node bbox.mjs diff.png → bounding boxes of red diff pixels, clustered by rows
import fs from 'node:fs'; import { PNG } from 'pngjs';
const d = PNG.sync.read(fs.readFileSync(process.argv[2])); const rows = [];
for (let y = 0; y < d.height; y++) { let minx = 1e9, maxx = -1; for (let x = 0; x < d.width; x++) { const i = (y * d.width + x) * 4; if (d.data[i] === 255 && d.data[i + 1] === 0 && d.data[i + 2] === 0) { minx = Math.min(minx, x); maxx = x; } } if (maxx >= 0) rows.push([y, minx, maxx]); }
const boxes = []; for (const [y, a, b] of rows) { const last = boxes.at(-1); if (last && y - last.y2 <= 3) { last.y2 = y; last.x1 = Math.min(last.x1, a); last.x2 = Math.max(last.x2, b); } else boxes.push({ y1: y, y2: y, x1: a, x2: b }); }
console.log(boxes.map(b => `[${b.x1},${b.y1}]-[${b.x2},${b.y2}]`).join(' '));
