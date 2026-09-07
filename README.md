# Jonathan Lenz campaign website

A responsive, section-based campaign website for Sonoma County Board of Education, Trustee Area 2. Campaign copy comes from `Website Content - Google Docs.pdf`; its text, with the explicit launch corrections recorded in CONTENT-AUDIT.md, is retained in `docs/source-extract.txt`.

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
- **Domain and SEO:** the canonical URL, Open Graph URL, sitemap and robots sitemap reference use `https://lenzforscboe.com/`. No unverified structured data or social image has been added.

## Updating the website

1. Edit files locally in this repository.
2. Preview and test locally (`python -m http.server 4173 --bind 127.0.0.1 --directory public`, `npm test`, and `python tests/content-audit.py`).
3. Commit:

   ```sh
   git add .
   git commit -m "Describe change"
   ```

4. Push:

   ```sh
   git push origin main
   ```

5. Cloudflare Pages automatically deploys the new `main` commit from the connected GitHub repository. There is no frontend build command; Pages serves `public/` and compiles `functions/`.
6. Check the successful deployment in Cloudflare and verify https://lenzforscboe.com/.

### Replacing the headshot

Save an authorized 10:11 portrait, recommended 800 × 880px, to `public/assets/images/jonathan-headshot.webp`. In the single `.portrait img` in `public/index.html`, change `src` from `/assets/images/headshot-placeholder.svg` to `/assets/images/jonathan-headshot.webp` and `alt` to `Jonathan Lenz`. Keep its width/height and the CSS frame; the surrounding layout remains unchanged. See [asset instructions](docs/ASSETS.md).

## Endorsement activation

The website can be published while its protected form remains disabled. To activate online endorsements, configure the public Turnstile site key, Cloudflare secrets, and private Google Sheet/Apps Script destination following [endorsement setup](docs/ENDORSEMENTS.md). Missing server configuration fails closed. Never fabricate keys or commit them.

The campaign can later replace the labeled sample endorser with approved names and supply the final headshot. The corrected endorsement copy is complete.

See [content integrity](docs/CONTENT-AUDIT.md), [validation](docs/TESTING.md), and [deployment status](docs/LAUNCH.md).
