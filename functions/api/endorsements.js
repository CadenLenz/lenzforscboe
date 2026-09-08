import { json, failure } from '../../lib/endorsements.js';
export async function onRequest({ request, env }) {
 if (request.method !== 'GET') return failure(405, 'GET');
 try {
  const { results } = await env.DB.prepare("SELECT name, role FROM endorsements WHERE status = 'approved' ORDER BY reviewed_at ASC, name ASC").all();
  return json({ endorsements: results.map(({ name, role }) => ({ name, role })) });
 } catch { return failure(); }
}
