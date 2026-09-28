// node imgdiff.mjs a.png b.png [diff.png] → prints differing pixel count
import fs from 'node:fs'; import { PNG } from 'pngjs'; import pixelmatch from 'pixelmatch';
const [a, b, out] = process.argv.slice(2).map(f => f);
const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b));
if (A.width !== B.width || A.height !== B.height) { console.log('size differs', A.width, A.height, B.width, B.height); process.exit(1); }
const D = new PNG({ width: A.width, height: A.height });
const n = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0.1 });
if (out) fs.writeFileSync(out, PNG.sync.write(D));
console.log(n);
