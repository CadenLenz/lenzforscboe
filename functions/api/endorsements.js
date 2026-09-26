import { json, failure } from '../../lib/endorsements.js';
export async function onRequest({ request, env }) {
 if (request.method !== 'GET') return failure(405, 'GET');
 try {
  const { results } = await env.DB.prepare("SELECT name, role FROM endorsements WHERE status = 'approved' ORDER BY reviewed_at ASC, name ASC").all();
  // Keep the campaign's requested placement without altering other endorsements.
  const mikeIndex = results.findIndex(({ name }) => name === 'Mike Gardner');
  if (mikeIndex !== -1) {
   const [mike] = results.splice(mikeIndex, 1);
   results.splice(Math.min(5, results.length), 0, mike);
  }
  return json({ endorsements: results.map(({ name, role }) => ({ name, role })) });
 } catch { return failure(); }
}
