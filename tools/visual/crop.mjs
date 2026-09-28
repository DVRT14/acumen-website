// node crop.mjs out.png x y w h scale a.png b.png diff.png  → side-by-side zoomed crops
import fs from 'node:fs'; import { PNG } from 'pngjs';
const [out, x, y, w, h, k, ...files] = process.argv.slice(2);
const X = +x, Y = +y, W = +w, H = +h, K = +k;
const imgs = files.map(f => PNG.sync.read(fs.readFileSync(f)));
const o = new PNG({ width: (W * K + 4) * imgs.length, height: H * K });
imgs.forEach((im, n) => { for (let j = 0; j < H * K; j++) for (let i = 0; i < W * K; i++) {
  const sx = X + Math.floor(i / K), sy = Y + Math.floor(j / K), si = (sy * im.width + sx) * 4, di = (j * o.width + n * (W * K + 4) + i) * 4;
  for (let c = 0; c < 4; c++) o.data[di + c] = im.data[si + c]; } });
fs.writeFileSync(out, PNG.sync.write(o));
