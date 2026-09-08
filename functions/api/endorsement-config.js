import { json, failure, ready } from '../../lib/endorsements.js';
export function onRequest({ request, env }) {
 if (request.method !== 'GET') return failure(405, 'GET');
 return json({ enabled: ready(env), siteKey: env.TURNSTILE_SITE_KEY || '' });
}
