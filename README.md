# Jonathan Lenz campaign website

Single-page campaign site for Sonoma County Board of Education, Trustee Area 2. [Production](https://lenzforscboe.com/) · [GitHub](https://github.com/CadenLenz/lenzforscboe)

## Architecture

Static HTML, CSS, and vanilla JavaScript; no framework, frontend build, runtime npm dependencies, or production Node server. Cloudflare Pages serves `public/` and compiles `functions/`. D1 holds private endorsement state. Resend sends review emails. Turnstile protects submissions. The nine campaign sections remain in one scrolling page, with a sticky navigation, active-section indication, mobile menu, reduced-motion support, and back-to-top link.

Campaign prose is sourced from the supplied PDF, with explicit user corrections in `docs/CONTENT-AUDIT.md`. Edit content in `public/index.html`; colors, spacing and image frames live in `public/css/styles.css`.

```text
public/                         Only publicly served files
  index.html, css/, js/          Page, design, navigation and form
  assets/images/                Authorized campaign photos
  _headers, _routes.json         Security headers and /api/* routing
functions/api/
  endorsement.js                Validated POST submission
  endorsement-config.js         Public site key and enabled flag only
  endorsement-review.js         GET confirmation / POST decision
  endorsements.js               GET approved name and role only
lib/endorsements.js              Shared validation, token and email code
migrations/0001_endorsements.sql D1 schema and public-query index
tests/                          Node security tests and source-content audit
wrangler.toml                   Pages settings, public variables, D1 binding
.dev.vars.example               Local configuration template, no real secrets
```

## Local development

Use Node **24+** (the test suite uses built-in `node:sqlite`) and Python 3 for the content audit. No `npm install` is required for application code.

```sh
npm test
python tests/content-audit.py
```

For a static visual preview:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory public
```

Open `http://127.0.0.1:4173/`. A static server does not execute APIs, so the form and endorsement-list service show unavailable states. For the full Cloudflare runtime, copy `.dev.vars.example` to the ignored `.dev.vars`, configure local test credentials, then:

```sh
npx wrangler d1 migrations apply lenzforscboe-endorsements --local
npx wrangler pages dev public --port 8788
```

Use a local D1 database and a controlled mailbox when testing. `--local` never targets the production database. Cloudflare publishes [Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) for development; never deploy them to production. The automated Node tests mock Turnstile and Resend and exercise real SQL in an in-memory SQLite database. They send no email and create no production data.

## Endorsement workflow

1. A visitor provides required name, role / affiliation, email and consent. The browser validates fields, obtains Turnstile verification, and sends JSON to `/api/endorsement`.
2. The Function validates origin, method, content type, bounded body and strings, email, consent, honeypot, and Turnstile success/hostname/action. Parameterized SQL inserts a **pending** D1 row.
3. Resend sends the submitted name, role and private email to **lenzforscboe@gmail.com**, with Approve and Decline links.
4. A link opens a clean confirmation page. The candidate presses **Confirm approve** or **Confirm decline**; no account login is required. GET never mutates data, preventing email-link scanners from making decisions.
5. POST atomically updates the pending row and removes its token hash. Approved names and roles appear automatically through `/api/endorsements`; declined and pending records stay private. The page refreshes this list on load, tab focus, and every 60 seconds while visible.

Only name and role are returned publicly. The public API never selects emails, timestamps, IDs, tokens or moderation status. DOM rendering uses `textContent`; review HTML and email markup escape all submitted values. Private declined records are retained in D1 for administration. The campaign may remove them using an authenticated D1 query when no longer needed.

Review tokens are 256-bit keyed HMAC values, unique to random submission IDs and creation times. D1 stores only SHA-256 hashes. Links expire after seven days; a successful decision consumes the token and prevents later changes through that link. The server secret allows an identical email to be regenerated for a delivery retry without storing the bearer token. Client request UUIDs and payload fingerprints prevent duplicate rows after lost responses. Resend idempotency keys deduplicate matching delivery attempts within its 24-hour window. A failed delivery leaves the row pending, preserves the visitor's entries, and reports a generic retry message.

## D1 setup and Pages binding

Production database: **lenzforscboe-endorsements**. Database ID: `7ccba6ee-0941-4c84-923a-3bea5cc5a0cb`. Pages binding: **DB**. These identifiers are public configuration, not credentials.

Initial provisioning (already done for this account; do not create a duplicate):

```sh
npx wrangler d1 create lenzforscboe-endorsements
npx wrangler d1 migrations apply lenzforscboe-endorsements --remote
```

`wrangler.toml` declares the binding and migrations directory. The same DB binding is configured on the production Pages project. Apply future migrations explicitly before deploying dependent code; Git builds do not automatically migrate D1. Never commit database files, exports or production records.

## Email provider and Turnstile setup

Resend is the transactional provider. Verify `lenzforscboe.com` in its Domains screen using the supplied DKIM record and sending-subdomain SPF/MX records. Those MX records are for `send.lenzforscboe.com`; do not replace unrelated or root receiving-email records. The sending address is `Jonathan Lenz Campaign <endorsements@lenzforscboe.com>`. The campaign's Gmail address receives moderation requests; this setup does not create an inbox at the sending address.

Create a Resend **Sending access** API key and save it as encrypted `EMAIL_API_KEY` in Cloudflare Pages → lenzforscboe → Settings → Production → Variables and secrets. Do not put it in frontend JavaScript or Git. Check Resend's delivery events after a controlled submission; acceptance by the API alone does not establish delivery to Gmail.

The managed Turnstile widget permits `lenzforscboe.com` and `lenzforscboe.pages.dev`. Its public site key lives in `wrangler.toml` and is served through `/api/endorsement-config`; its secret stays encrypted in Cloudflare. Both client and server use the action `endorsement`, and the server checks the requesting hostname.

## Environment variables

| Name | Purpose | Storage |
| --- | --- | --- |
| `DB` | D1 source of truth | Pages D1 binding |
| `PUBLIC_SITE_URL` | Canonical origin for review links | Public config; `https://lenzforscboe.com` |
| `ALLOWED_ORIGINS` | Exact comma-separated permitted origins, without trailing slash | Public config |
| `TURNSTILE_SITE_KEY` | Browser verification widget | Public config |
| `TURNSTILE_SECRET_KEY` | Server-side verification | Encrypted secret |
| `EMAIL_API_KEY` | Resend sending access | Encrypted secret |
| `ENDORSEMENT_FROM_EMAIL` | Verified Resend sender | Public config |
| `ENDORSEMENT_REVIEW_EMAIL` | `lenzforscboe@gmail.com` | Public config |
| `REVIEW_TOKEN_SECRET` | At least 32 random characters for review-token generation | Encrypted secret |

The production public values and D1 binding are maintained in `wrangler.toml`, which is the Pages configuration source of truth. Secrets are configured separately in Cloudflare. The browser only receives the public Turnstile key and enabled flag, never any server secret. Missing required configuration disables the form and fails closed on submission. Secret changes take effect on the next deployment. Preview deployments do not receive production email credentials.

## Campaign photos

Two user-supplied photographs are included as optimized WebP assets without embedded camera metadata. The outdoor portrait comes from IMG_1012.HEIC and appears in the hero at a 10:11 display ratio. The school board image comes from Screenshot 2026-09-07 181846.png and retains its full 410:491 frame, including the president nameplate. Both have descriptive alt text and intrinsic dimensions; the hero loads with high priority and the board photo loads lazily.

## Review and debug endorsements

Use email links for ordinary moderation. If a request is missing, check Resend delivery/bounce events and the authenticated D1 console. Example private status query:

```sql
SELECT id, status, created_at, reviewed_at, email_sent_at
FROM endorsements ORDER BY created_at DESC LIMIT 20;
```

Do not paste private rows or review links into public issues. A null `email_sent_at` indicates delivery was not confirmed by Resend's API; visitor retries reuse the request ID when entries are unchanged. For an expired link, review the private submission in D1 and use an authenticated, parameterized maintenance query to make the intended decision, clearing `approval_token_hash`; there is no public administrator endpoint. To unpublish an approved record, change only its identified row to `declined` through the private console. Avoid broad UPDATE/DELETE statements.

Cloudflare Functions failures use generic client messages and do not log request bodies or tokens. Inspect bindings and encrypted-variable names before investigating provider errors. Resend may accept an email that later bounces; check the provider's event status. If the form is unavailable, the campaign email remains visible.

## Deployment workflow

The public repository is **CadenLenz/lenzforscboe**, branch **main**. The existing Cloudflare Pages project **lenzforscboe** is Git-connected with automatic production deployments enabled. Build command: empty. Output directory: **public**. Functions are compiled by Pages. No manual-upload hosting is used.

1. Edit, run `npm test` and `python tests/content-audit.py`, and inspect the local browser.
2. Inspect `git status`, `git diff`, and staged files. Exclude `.dev.vars`, `.env`, credentials, databases and test output.
3. `git add` the intended source files, then `git commit -m "Describe the change"`.
4. `git push origin main` triggers Cloudflare's Git build.
5. Verify the deployment commit/status in Cloudflare, then open https://lenzforscboe.com/ and test its APIs. Preserve the www → root 301 redirect, path and query string.

See [test results](docs/TESTING.md), [launch status](docs/LAUNCH.md) and [content audit](docs/CONTENT-AUDIT.md). Do not infer a successful email workflow from a successful static build alone.
