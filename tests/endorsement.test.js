import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { onRequest } from "../functions/api/endorsement.js";

const env = {
  ALLOWED_ORIGINS: "https://campaign.example",
  TURNSTILE_SECRET_KEY: "test-secret",
  SHEETS_SIGNING_SECRET: "a-test-only-secret-of-at-least-32-characters",
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/test/exec",
};
const valid = {
  name: " Jane Doe ",
  affiliation: " Educator ",
  email: " jane@example.com ",
  consent: true,
  website: "",
  token: "test-token",
};
function request(body = valid, options = {}) {
  const {
    method = "POST",
    origin = "https://campaign.example",
    type = "application/json",
  } = options;
  return new Request("https://campaign.example/api/endorsement", {
    method,
    headers: { Origin: origin, "Content-Type": type },
    ...(method === "GET"
      ? {}
      : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
}
test("POST only and same-origin requests only", async () => {
  assert.equal(
    (await onRequest({ request: request(null, { method: "GET" }), env }))
      .status,
    405,
  );
  assert.equal(
    (
      await onRequest({
        request: request(valid, { origin: "https://evil.example" }),
        env,
      })
    ).status,
    403,
  );
  assert.equal(
    (await onRequest({ request: request(valid, { origin: "" }), env })).status,
    403,
  );
  assert.equal(
    (await onRequest({ request: request(valid, { type: "text/plain" }), env }))
      .status,
    415,
  );
});
test("invalid input is rejected before any external request", async () => {
  const bodies = [
    "{",
    [],
    null,
    { ...valid, name: "" },
    { ...valid, name: "a".repeat(121) },
    { ...valid, name: 123 },
    { ...valid, email: "bad" },
    { ...valid, email: "x".repeat(255) },
    { ...valid, consent: false },
    { ...valid, consent: "true" },
    { ...valid, website: "bot" },
    { ...valid, token: "" },
    { ...valid, token: "a".repeat(2049) },
    { ...valid, extra: "bad" },
    { ...valid, name: "name\nmalformed" },
    { ...valid, affiliation: "x".repeat(181) },
    "x".repeat(9000),
  ];
  for (const body of bodies)
    assert.equal(
      (await onRequest({ request: request(body), env })).status,
      400,
    );
});
test("successful verification signs normalized Pending submission without token or IP", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    if (calls === 1) {
      assert.equal(
        url,
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      );
      assert.deepEqual(JSON.parse(options.body), {
        secret: "test-secret",
        response: "test-token",
      });
      return Response.json({
        success: true,
        hostname: "campaign.example",
        action: "endorsement",
      });
    }
    const envelope = JSON.parse(options.body);
    assert.equal(
      envelope.signature,
      createHmac("sha256", env.SHEETS_SIGNING_SECRET)
        .update(envelope.payload)
        .digest("hex"),
    );
    const data = JSON.parse(envelope.payload);
    assert.equal(data.name, "Jane Doe");
    assert.equal(data.affiliation, "Educator");
    assert.equal(data.email, "jane@example.com");
    assert.equal(data.status, "Pending");
    assert.equal(data.consent, true);
    assert.equal(data.token, undefined);
    assert.equal(data.ip, undefined);
    return Response.json({ ok: true });
  });
  const result = await onRequest({ request: request(), env });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true });
  assert.equal(calls, 2);
  assert.equal(result.headers.get("Cache-Control"), "no-store");
});
test("invalid, expired, replayed, wrong-host and wrong-action tokens never reach Sheets", async (t) => {
  for (const verification of [
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, hostname: "evil.example", action: "endorsement" },
    { success: true, hostname: "campaign.example", action: "other" },
  ]) {
    let calls = 0;
    const mock = t.mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json(verification);
    });
    assert.equal((await onRequest({ request: request(), env })).status, 400);
    assert.equal(calls, 1);
    mock.mock.restore();
  }
});
test("configuration, upstream, network and non-JSON failures fail closed", async (t) => {
  assert.equal(
    (
      await onRequest({
        request: request(),
        env: { ...env, TURNSTILE_SECRET_KEY: "" },
      })
    ).status,
    503,
  );
  assert.equal(
    (
      await onRequest({
        request: request(),
        env: { ...env, GOOGLE_SCRIPT_URL: "https://evil.example/exec" },
      })
    ).status,
    503,
  );
  for (const failure of ["network", "verification", "sheet", "json"]) {
    let count = 0;
    const mock = t.mock.method(globalThis, "fetch", async () => {
      count++;
      if (failure === "network") throw new Error("sensitive upstream details");
      if (failure === "verification") return new Response("", { status: 500 });
      if (count === 1)
        return Response.json({
          success: true,
          hostname: "campaign.example",
          action: "endorsement",
        });
      return failure === "json"
        ? new Response("<html>Error</html>")
        : Response.json({ ok: false });
    });
    const result = await onRequest({ request: request(), env });
    assert.equal(result.status, 503);
    assert.ok(!(await result.text()).includes("sensitive"));
    mock.mock.restore();
  }
});
test("Apps Script authenticates, refuses stale payloads, deduplicates and neutralizes formulas", () => {
  const rows = [];
  const sheet = {
    getRange: () => ({
      createTextFinder: (nonce) => ({
        matchEntireCell: () => ({
          findNext: () => rows.find((row) => row[6] === nonce),
        }),
      }),
    }),
    appendRow: (row) => rows.push(row),
  };
  const context = {
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (content) => ({
        setMimeType: () => JSON.parse(content),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) =>
          key === "SHEETS_SIGNING_SECRET" ? env.SHEETS_SIGNING_SECRET : "sheet",
      }),
    },
    Utilities: {
      Charset: { UTF_8: "utf8" },
      computeHmacSha256Signature: (payload, secret) => [
        ...createHmac("sha256", secret).update(payload).digest(),
      ],
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        hasLock: () => true,
        releaseLock: () => {},
      }),
    },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }) },
  };
  vm.createContext(context);
  vm.runInContext(
    readFileSync(
      new URL("../tools/google-apps-script.gs", import.meta.url),
      "utf8",
    ),
    context,
  );
  const payload = {
    timestamp: new Date().toISOString(),
    nonce: crypto.randomUUID(),
    name: '=IMPORTXML("evil")',
    affiliation: "+formula",
    email: "test@example.com",
    consent: true,
    status: "Pending",
  };
  const send = (value, signature) => {
    const body = JSON.stringify(value);
    return context.doPost({
      postData: {
        contents: JSON.stringify({
          payload: body,
          signature:
            signature ??
            createHmac("sha256", env.SHEETS_SIGNING_SECRET)
              .update(body)
              .digest("hex"),
        }),
      },
    });
  };
  assert.equal(send(payload, "0".repeat(64)).ok, false);
  assert.equal(
    send({ ...payload, timestamp: "2020-01-01T00:00:00Z" }).ok,
    false,
  );
  assert.equal(send(payload).ok, true);
  assert.equal(rows.length, 1);
  assert.equal(rows[0][1], '\'=IMPORTXML("evil")');
  assert.equal(rows[0][2], "'+formula");
  assert.equal(rows[0][5], "Pending");
  assert.equal(send(payload).ok, true);
  assert.equal(rows.length, 1);
});
