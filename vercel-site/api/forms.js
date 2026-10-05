// Every site form POSTs here (multipart FormData, the old form field names). The submission is
// forwarded as JSON to FORMS_WEBHOOK_URL (a Power Automate / Zapier / Make HTTP trigger, a Teams or
// Slack workflow, a CRM endpoint, ...). Without a working webhook the visitor gets the error message:
// never report success for a submission that went nowhere.
// Files (the vacancy forms' CV) go along base64-encoded in `files`; 4 MB total keeps the request under
// Vercel's 4.5 MB function body limit.
const MAX_BYTES = 4_000_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) return Response.json({ success: false }, { status: 413 });
  let data;
  try { data = await request.formData(); } catch { return Response.json({ success: false }, { status: 400 }); }

  const fields = {}, files = [];
  for (const [key, value] of data) {
    const m = key.match(/^form_fields\[([^\]]+)\](\[\])?$/);
    if (!m) continue;
    if (typeof value === 'string') fields[m[1]] = value.slice(0, 5000);
    else if (value.size) files.push({ field: m[1], name: value.name, type: value.type, size: value.size, data: Buffer.from(await value.arrayBuffer()).toString('base64') });
  }
  if (fields.email !== undefined && !EMAIL.test(fields.email)) return Response.json({ success: false }, { status: 422 });

  const submission = { form_id: data.get('form_id'), page: data.get('referer_title'), fields, files, at: new Date().toISOString() };
  // Logs keep the fields, not file contents.
  const logged = JSON.stringify({ ...submission, files: files.map(({ data, ...meta }) => meta) });
  const webhook = process.env.FORMS_WEBHOOK_URL;
  if (!webhook) {
    console.error('form submission not delivered: FORMS_WEBHOOK_URL is not set', logged);
    return Response.json({ success: false }, { status: 503 });
  }
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(submission),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`webhook answered ${res.status}`);
  } catch (err) {
    // The fields are logged so a failed delivery can still be recovered (attachments are not).
    console.error('form submission not delivered:', err.message, logged);
    return Response.json({ success: false }, { status: 502 });
  }
  return Response.json({ success: true });
}
