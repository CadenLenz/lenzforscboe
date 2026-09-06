const MESSAGE = "Unable to process this submission. Please try again later.";
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
function response(status, ok = false) {
  return new Response(
    JSON.stringify(ok ? { ok: true } : { ok: false, message: MESSAGE }),
    {
      status,
      headers: status === 405 ? { ...headers, Allow: "POST" } : headers,
    },
  );
}
const text = (value, max, required = false) => {
  if (typeof value !== "string") throw new Error("Invalid field");
  const normalized = value.normalize("NFC").trim();
  if (
    normalized.length > max ||
    (required && !normalized) ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  )
    throw new Error("Invalid field");
  return normalized;
};
async function boundedBody(request) {
  if (Number(request.headers.get("Content-Length")) > 8192 || !request.body)
    throw new Error("Invalid body");
  const reader = request.body.getReader();
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        throw new Error("Invalid body");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
export async function onRequest({ request, env }) {
  if (request.method !== "POST") return response(405);
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const origin = request.headers.get("Origin");
  if (
    !origin ||
    !allowed.includes(origin) ||
    origin !== new URL(request.url).origin
  )
    return response(403);
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return response(415);
  let data;
  try {
    const raw = await boundedBody(request);
    const expected = [
      "name",
      "affiliation",
      "email",
      "consent",
      "website",
      "token",
    ];
    if (
      !raw ||
      Array.isArray(raw) ||
      typeof raw !== "object" ||
      Object.keys(raw).some((key) => !expected.includes(key))
    )
      return response(400);
    data = {
      name: text(raw.name, 120, true),
      affiliation: text(raw.affiliation ?? "", 180),
      email: text(raw.email ?? "", 254),
      token: text(raw.token, 2048, true),
    };
    if (raw.consent !== true || text(raw.website ?? "", 180) !== "")
      return response(400);
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      return response(400);
  } catch {
    return response(400);
  }
  try {
    if (
      !env.TURNSTILE_SECRET_KEY ||
      !env.SHEETS_SIGNING_SECRET ||
      env.SHEETS_SIGNING_SECRET.length < 32
    )
      return response(503);
    const destination = new URL(env.GOOGLE_SCRIPT_URL);
    if (
      destination.protocol !== "https:" ||
      destination.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[^/]+\/exec$/.test(destination.pathname) ||
      destination.search
    )
      return response(503);
    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: data.token,
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!verification.ok) return response(503);
    const verified = await verification.json();
    if (
      verified.success !== true ||
      verified.action !== "endorsement" ||
      verified.hostname !== new URL(origin).hostname
    )
      return response(400);
    // Sign the exact payload bytes. Neither Google credentials nor the signing secret reach the browser.
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      nonce: crypto.randomUUID(),
      name: data.name,
      affiliation: data.affiliation,
      email: data.email,
      consent: true,
      status: "Pending",
    });
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.SHEETS_SIGNING_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payload),
    );
    const signature = [...new Uint8Array(signatureBytes)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const result = await fetch(destination.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, signature }),
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!result.ok || (await result.json()).ok !== true) return response(503);
    return response(200, true);
  } catch {
    return response(503);
  }
}
