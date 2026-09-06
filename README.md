# Jonathan Lenz campaign website

A responsive, section-based campaign website for Sonoma County Board of Education, Trustee Area 2. Campaign copy comes from `Website Content - Google Docs.pdf`; its extracted text is retained in `docs/source-extract.txt`.

## Architecture

Static HTML5, CSS, and vanilla JavaScript. No framework, CSS library, database, production Node process, or static-site build step. Cloudflare Pages serves `public/` directly. One Pages Function handles endorsement submissions. A signed server-to-server request writes to a private Google Sheet through Apps Script. Every submission starts as **Pending**; the website never reads the moderation queue.

`public/` is deliberately separate from server code, documentation and secrets, so a static deployment cannot serve those files. `package.json` only enables ECMAScript modules and the built-in Node test runner; there are no npm dependencies.

```text
public/
  index.html                 All campaign content and footer statements
  404.html                   Accessible missing-page response
  css/styles.css             Responsive design tokens and layouts
  js/enhance.js              Pre-paint progressive-enhancement flag
  js/main.js                 Navigation, scroll position, back to top
  js/endorsements.js         Form, public Turnstile site key, response states
  assets/                    Original campaign artwork and favicon
  _headers, _routes.json     Cloudflare security and function routing
  robots.txt, sitemap.xml    Search-engine configuration
functions/api/endorsement.js Secure POST endpoint
tools/google-apps-script.gs  Authenticated moderation-queue receiver
tests/endorsement.test.js    API and Apps Script security tests
docs/                      Deployment, maintenance, content and test reports
wrangler.toml              Pages configuration; publish directory is public/
.dev.vars.example          Local secret/configuration example
```

## Local preview

From the repository root, use any static web server, for example:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory public
```

Open `http://127.0.0.1:4173/`. This previews reading, responsive navigation and disabled-form behavior. It does not execute Pages Functions. Do not preview by opening the HTML with `file://`; asset paths are relative to the web origin.

For the real Pages runtime, install Node 22+ and run:

```sh
npx wrangler pages dev public
```

Create `.dev.vars` from `.dev.vars.example` before testing the configured API. Use a separate test Sheet and Turnstile configuration; do not populate the real moderation queue during automated tests.

Run dependency-free security tests with `npm test` or `node --test tests/endorsement.test.js`.

## Deployment and configuration

Follow [Cloudflare deployment](docs/DEPLOYMENT.md) for GitHub, Pages and custom domain setup, and [endorsement setup](docs/ENDORSEMENTS.md) for Turnstile and Google Sheets.

Cloudflare server configuration:

| Name | Purpose | Secret? |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | Comma-separated exact permitted site origins, including scheme, without trailing slash | No |
| `TURNSTILE_SECRET_KEY` | Server-side Cloudflare verification key | Yes |
| `GOOGLE_SCRIPT_URL` | Deployed Apps Script `/exec` URL; server-only destination | Keep server-side |
| `SHEETS_SIGNING_SECRET` | Shared random signing key, at least 32 characters | Yes |

Apps Script Properties: `SHEET_ID` and the same `SHEETS_SIGNING_SECRET`. The only client-side key is `TURNSTILE_SITE_KEY` in `public/js/endorsements.js`; it is public by design.

## Update campaign content

Edit the appropriate section directly in `public/index.html`. All prose is present in HTML, including when JavaScript is unavailable. Preserve stable section IDs and heading associations. No content regeneration or build is required. Keep the content audit current after approved wording changes.

- **Endorsements:** copy the sample `.endorser` article, replace the bracketed fields with an intentionally approved name and affiliation, and remove the sample’s `Placeholder` label. Escape HTML special characters. Do not copy emails, tokens, or the entire Sheet. See [moderation instructions](docs/ENDORSEMENTS.md).
- **Photos / artwork:** see [assets](docs/ASSETS.md). The portrait is explicitly a placeholder; no candidate photograph has been fabricated.
- **Colors and layout:** edit the custom properties at the beginning of `public/css/styles.css`.
- **Footer:** `#paid-for` is the one visible paid-for statement; `#campaign-disclaimer` is the non-affiliation statement. Both are near the end of `public/index.html`.
- **Year:** the HTML fallback is 2026; JavaScript uses the visitor’s current year. Update the fallback annually if maintaining a no-JavaScript current year is important.
- **Domain and SEO:** replace `https://campaign.example/` in HTML metadata, `robots.txt` and `sitemap.xml` with the real canonical domain before launch. No unverified structured data or social image has been added.

## Before public launch

This is an implemented deployment package, with campaign-supplied items still required:

1. Supply an authorized candidate portrait.
2. Complete the endorsement paragraph. The campaign confirmed it is currently incomplete; the draft preserves the fragment and marks it as awaiting completion.
3. Replace or remove the clearly marked sample endorser component.
4. Set the real domain, public Turnstile site key, Cloudflare secrets and Apps Script properties.
5. Run a real Turnstile-to-Sheet test and confirm a **Pending** row, private email, and no automatic public display.

The online form deliberately remains disabled while its public site key is blank. Missing server configuration fails closed. No live deployment, real secret, domain, or real Sheet is implied by the example configuration.

See [content integrity](docs/CONTENT-AUDIT.md) and [validation results](docs/TESTING.md).
