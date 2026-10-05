// Self-check for vercel-site/api/forms.js: node tools/forms-check.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import { POST } from '../vercel-site/api/forms.js';

const received = [];
let status = 200;
const hook = http.createServer((req, res) => {
  let body = '';
  req.on('data', c => { body += c; }).on('end', () => { received.push(JSON.parse(body)); res.writeHead(status).end(); });
});
await new Promise(r => hook.listen(0, r));

const post = (fields, file) => {
  const fd = new FormData();
  fd.set('form_id', 'contact');
  for (const [k, v] of Object.entries(fields)) fd.set(`form_fields[${k}]`, v);
  if (file) fd.append('form_fields[cv][]', file, 'cv.pdf');
  return POST(new Request('http://x/api/forms', { method: 'POST', body: fd }));
};
console.error = () => {}; // the failure paths log on purpose

delete process.env.FORMS_WEBHOOK_URL;
assert.equal((await post({ email: 'a@b.be' })).status, 503, 'no webhook: must not report success');

process.env.FORMS_WEBHOOK_URL = `http://localhost:${hook.address().port}/`;
assert.equal((await post({ email: 'nope' })).status, 422, 'invalid email rejected');
const ok = await post({ email: 'a@b.be', message: 'hi' });
assert.equal(ok.status, 200);
assert.deepEqual(await ok.json(), { success: true });
assert.deepEqual(received.at(-1).fields, { email: 'a@b.be', message: 'hi' }, 'fields forwarded');

const pdf = new Blob([Buffer.alloc(300_000, 7)], { type: 'application/pdf' }); // bigger than the old 100 kB cap
assert.equal((await post({ email: 'a@b.be' }, pdf)).status, 200, 'CV upload accepted');
const [cv] = received.at(-1).files;
assert.deepEqual([cv.field, cv.name, cv.type, cv.size], ['cv', 'cv.pdf', 'application/pdf', 300_000]);
assert.equal(Buffer.from(cv.data, 'base64').length, 300_000, 'file content forwarded');

status = 500;
assert.equal((await post({ email: 'a@b.be' })).status, 502, 'webhook failure surfaces as an error');

hook.close();
console.log('forms-check ok');
