// Form submission stub. Every site form POSTs here (multipart FormData, the old form field names).
// TODO(forms-backend): the backend is not decided yet — deliver the submission (mail, CRM, …) here.
const MAX_BYTES = 100_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) return Response.json({ success: false }, { status: 413 });
  let data;
  try { data = await request.formData(); } catch { return Response.json({ success: false }, { status: 400 }); }

  const fields = {};
  for (const [key, value] of data) {
    const m = key.match(/^form_fields\[(.+)\]$/);
    if (m && typeof value === 'string') fields[m[1]] = value.slice(0, 5000);
  }
  if (fields.email !== undefined && !EMAIL.test(fields.email)) return Response.json({ success: false }, { status: 422 });

  const submission = { form_id: data.get('form_id'), page: data.get('referer_title'), fields, at: new Date().toISOString() };
  console.log('form submission', JSON.stringify(submission));
  return Response.json({ success: true });
}
