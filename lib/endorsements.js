export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra } });
export const failure = (status = 503, method) => json({ ok: false, message: 'Unable to process this request. Please try again later.' }, status, method ? { Allow: method } : {});
export function sameOrigin(request, env) {
 const origin = request.headers.get('Origin');
 return !!origin && origin === new URL(request.url).origin && (env.ALLOWED_ORIGINS || env.PUBLIC_SITE_URL || '').split(',').map(s => s.trim()).includes(origin);
}
export function ready(env) {
 return !!(env.DB && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.EMAIL_API_KEY && env.ENDORSEMENT_FROM_EMAIL && env.ENDORSEMENT_REVIEW_EMAIL && env.PUBLIC_SITE_URL && env.REVIEW_TOKEN_SECRET?.length >= 32);
}
export function field(value, max, required = true) {
 if (typeof value !== 'string') throw new Error('Invalid field');
 const clean = value.normalize('NFC').trim();
 if (clean.length > max || (required && !clean) || /[\u0000-\u001f\u007f]/u.test(clean)) throw new Error('Invalid field');
 return clean;
}
export async function body(request, limit = 8192) {
 if (!request.body || Number(request.headers.get('Content-Length')) > limit) throw new Error('Invalid body');
 const reader = request.body.getReader(); const chunks = []; let size = 0;
 try { while (true) {
  const { done, value } = await reader.read(); if (done) break;
  size += value.byteLength;
  if (size > limit) { await reader.cancel(); throw new Error('Invalid body'); }
  chunks.push(value);
 }} finally { reader.releaseLock(); }
 const bytes = new Uint8Array(size); let offset = 0;
 for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
 return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
const hex = bytes => [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
export const hash = async value => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
// Keyed PRF permits identical delivery retries without storing bearer tokens in D1.
export async function reviewToken(env, row) {
 const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.REVIEW_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
 return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`endorsement-review:v1:${row.id}:${row.created_at}`)));
}
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function sendReview(env, row) {
 const token = await reviewToken(env, row);
 const url = new URL('/api/endorsement-review', env.PUBLIC_SITE_URL);
 url.searchParams.set('token', token);
 url.searchParams.set('action', 'approve'); const approve = url.href;
 url.searchParams.set('action', 'decline'); const decline = url.href;
 const result = await fetch('https://api.resend.com/emails', {
  method: 'POST', headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `endorsement-review/${row.id}` },
  body: JSON.stringify({ from: env.ENDORSEMENT_FROM_EMAIL, to: [env.ENDORSEMENT_REVIEW_EMAIL], subject: `Endorsement review: ${row.name}`,
   text: `Name: ${row.name}\nRole / Affiliation: ${row.role}\nEmail: ${row.email}\nSubmitted: ${new Date(row.created_at).toISOString()}\n\nApprove: ${approve}\nDecline: ${decline}\n\nLinks expire in 7 days. Confirm your choice on the page. Email stays private.`,
   html: `<h1>Endorsement ready for review</h1><p><strong>Name:</strong> ${escapeHTML(row.name)}<br><strong>Role / Affiliation:</strong> ${escapeHTML(row.role)}<br><strong>Email:</strong> ${escapeHTML(row.email)}</p><p><a href="${escapeHTML(approve)}">Approve</a> &nbsp; <a href="${escapeHTML(decline)}">Decline</a></p><p>Links expire in 7 days. Confirm your choice on the page. Only an approved name and role will appear publicly; email stays private.</p>`
  }), signal: AbortSignal.timeout(12000)
 });
 if (!result.ok || !(await result.json()).id) throw new Error('Delivery failed');
}
