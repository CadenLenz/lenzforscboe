import { json, failure, sameOrigin, ready, field, body, hash, reviewToken, sendReview } from '../../lib/endorsements.js';
export async function onRequest({ request, env }) {
 if (request.method !== 'POST') return failure(405, 'POST');
 if (!sameOrigin(request, env)) return failure(403);
 if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return failure(415);
 let data;
 try {
  const raw = JSON.parse(await body(request));
  if (!raw || Array.isArray(raw) || Object.keys(raw).some(k => !['name','role','email','consent','website','token','requestId'].includes(k))) return failure(400);
  data = { name: field(raw.name, 120), role: field(raw.role, 180), email: field(raw.email, 254), token: field(raw.token, 2048), requestId: field(raw.requestId, 36) };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(data.requestId) || raw.consent !== true || field(raw.website ?? '', 180, false)) return failure(400);
 } catch { return failure(400); }
 if (!ready(env)) return failure(503);
 try {
  const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
   method: 'POST', headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: data.token }), signal: AbortSignal.timeout(8000)
  });
  if (!verification.ok) return failure();
  const verified = await verification.json();
  if (verified.success !== true || verified.action !== 'endorsement' || verified.hostname !== new URL(request.url).hostname) return failure(400);
  const fingerprint = await hash(JSON.stringify([data.name, data.role, data.email]));
  const now = Date.now(); const candidate = { id: crypto.randomUUID(), created_at: now };
  const tokenHash = await hash(await reviewToken(env, candidate));
  await env.DB.prepare('INSERT OR IGNORE INTO endorsements (id,name,role,email,created_at,approval_token_hash,token_expires_at,request_key,request_hash) VALUES (?,?,?,?,?,?,?,?,?)')
   .bind(candidate.id, data.name, data.role, data.email, now, tokenHash, now + 7 * 86400000, data.requestId, fingerprint).run();
  const row = await env.DB.prepare('SELECT * FROM endorsements WHERE request_key = ?').bind(data.requestId).first();
  if (!row || row.request_hash !== fingerprint) return failure(409);
  if (row.email_sent_at || row.status !== 'pending') return json({ ok: true });
  if (row.token_expires_at <= now) return failure(409);
  await sendReview(env, row);
  await env.DB.prepare('UPDATE endorsements SET email_sent_at = ? WHERE id = ?').bind(Date.now(), row.id).run();
  return json({ ok: true });
 } catch { return failure(); }
}
