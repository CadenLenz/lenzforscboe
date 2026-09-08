import { body, hash, escapeHTML, sameOrigin } from '../../lib/endorsements.js';
function page(title, content, status = 200) {
 return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} · Jonathan Lenz</title><link rel="stylesheet" href="/css/styles.css"></head><body><main class="container section review-page"><p class="eyebrow">Jonathan Lenz · Endorsements</p><h1>${title}</h1>${content}<p><a href="/#endorsements">Return to the campaign website</a></p></main></body></html>`, { status, headers: {
  'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
 }});
}
const invalid = () => page('Link unavailable', '<p>This link is invalid, expired, or has already been used. No changes were made.</p>', 400);
export async function onRequest({ request, env }) {
 if (!['GET','POST'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
 try {
  let values = new URL(request.url).searchParams;
  if (request.method === 'POST') {
   // Chrome sends Origin: null for a no-referrer form navigation. Fetch Metadata
   // still identifies the same-origin confirmation page; the one-time token authenticates it.
   const privateNavigation = request.headers.get('Origin') === 'null' && request.headers.get('Sec-Fetch-Site') === 'same-origin';
   if (!sameOrigin(request, env) && !privateNavigation) return invalid();
   if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/x-www-form-urlencoded') return invalid();
   values = new URLSearchParams(await body(request, 1024));
  }
  const token = values.get('token'); const action = values.get('action');
  if (!/^[a-f0-9]{64}$/.test(token || '') || !['approve','decline'].includes(action)) return invalid();
  const tokenHash = await hash(token);
  const row = await env.DB.prepare("SELECT id,name,role FROM endorsements WHERE approval_token_hash = ? AND status = 'pending' AND token_expires_at > ?").bind(tokenHash, Date.now()).first();
  if (!row) return invalid();
  const label = action === 'approve' ? 'Approve' : 'Decline';
  // Email scanners may follow GET links. Only explicit POST changes state.
  if (request.method === 'GET') return page(`${label} endorsement`, `<p><strong>${escapeHTML(row.name)}</strong><br>${escapeHTML(row.role)}</p><p>${action === 'approve' ? 'Publish this name and role on the campaign website?' : 'Keep this endorsement off the public website?'}</p><form method="post" action="/api/endorsement-review"><input type="hidden" name="token" value="${token}"><input type="hidden" name="action" value="${action}"><button class="button" type="submit">Confirm ${action}</button></form>`);
  const state = action === 'approve' ? 'approved' : 'declined';
  const updated = await env.DB.prepare("UPDATE endorsements SET status = ?, reviewed_at = ?, approval_token_hash = NULL WHERE id = ? AND approval_token_hash = ? AND status = 'pending' AND token_expires_at > ?")
   .bind(state, Date.now(), row.id, tokenHash, Date.now()).run();
  if (updated.meta.changes !== 1) return invalid();
  return page(`Endorsement ${state}`, `<p>${state === 'approved' ? 'The name and role are now approved for public display.' : 'This endorsement will not appear publicly.'} The email address remains private.</p>`);
 } catch { return page('Review unavailable', '<p>We could not complete this request. Please try again later.</p>', 503); }
}
