# Validation report

Validated September 6, 2026, on the supplied Windows workspace using Chrome, Playwright, Node 24, Python and Wrangler 4.129.0.

## Results

| Check | Result |
| --- | --- |
| HTML5 parser | No parse errors in `public/index.html` |
| Content-integrity script | All nine sections, substantive PDF prose, unfinished endorsement fragment, exact thank-you, footer statements and local anchors accounted for |
| API / Apps Script tests | Six test groups passed, including malformed payload variants, method/origin/content-type enforcement, signature validation, stale/replayed requests and spreadsheet formulas |
| Cloudflare Pages compilation | `wrangler pages functions build functions --outdir tmp/worker` succeeded |
| Local Cloudflare runtime | Static site served; all four header rules parsed; unconfigured API refused POST with 403 |
| Responsive widths | 320, 375, 430, 768, 1440 and 1920px: no horizontal overflow |
| Visual review | Inspected desktop hero, experience, board comparison and endorsements; mobile hero, endorsements, contact and footer; full-page captures produced for all six widths |
| Navigation | All nine main links, current-section highlight, sticky-heading clearance, menu close after selection, Escape, and back-to-top passed |
| Keyboard | Skip link, focus transfer, mobile-menu focus cycling and Escape return passed |
| Enlarged text | 200% root text at 375px: no horizontal overflow after layout fixes |
| Reduced motion | Computed scroll behavior is `auto` |
| JavaScript unavailable | All nine content sections and all section-navigation links remain available; mobile fallback header is not sticky |
| Form validation | Required name, invalid email and consent validation; messages are associated with fields |
| Form failure | Simulated 503 shows a generic message, retains entries and resets verification |
| Form success | Simulated verified success displays the exact source thank-you and clears fields |
| Public endorsements | Test submissions did not alter the public sample component |
| Browser errors | Zero unexpected JavaScript or console errors in normal browsing; the intentionally simulated 503 produces the expected browser network error |
| Public secrets | Public-file inspection found no server secret, Sheet ID or Apps Script destination; the public Turnstile key is blank |
| Security headers | CSP, nosniff and related static rules served by local Pages runtime; API returns no-store JSON |

## Lighthouse

Final mobile Lighthouse run against local Wrangler at `http://127.0.0.1:8788/`:

| Category / metric | Result |
| --- | --- |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Largest Contentful Paint | 0.9 seconds |
| Total Blocking Time | 0 milliseconds |
| Cumulative Layout Shift | 0 |

The final report is saved alongside this file as `lighthouse.html` and `lighthouse.json`. These are local lab results, not a production performance guarantee or a claim of complete WCAG conformance. The real domain and Turnstile widget were not configured. Run Lighthouse again after those launch inputs and a real portrait are added.

An earlier audit found a menu flash that shifted page content on mobile. A tiny pre-style enhancement script now establishes the initial menu state before first paint. No-JavaScript browsers retain the expanded navigation fallback. The final run above is after this fix.

## Reproduce

Security tests need only Node 22+:

```sh
npm test
python tests/content-audit.py
```

For the optional browser suite, start the static server on port 4173 as described in README. Install Playwright in your development environment (for example, `npm install --no-save --package-lock=false playwright`) and ensure Chrome is installed, then run:

```sh
node tests/browser.cjs
```

Alternatively, set `PLAYWRIGHT_MODULE` to an existing Playwright module path. Browser outputs go to the ignored `tmp/` directory. The suite intercepts Turnstile and the submission endpoint to exercise deterministic UI states; it does not send personal data to Google.

For HTML parsing, install the optional Python `html5lib` validation tool and parse the HTML file in strict checking mode. This package is a local QA tool, not a website dependency. Lighthouse likewise runs as a development audit tool, not as part of the deployed site.

## Remaining external verification

- No live Cloudflare production deployment, DNS connection, real Turnstile challenge or real Google Sheet write was performed; the campaign’s account configuration was not supplied.
- Apps Script executes in the local test harness for logic checks. Actual Google authorization, quotas, ownership and web-app permissions require the campaign setup steps.
- The source paragraph is still incomplete and images/endorsers/domain placeholders remain deliberately visible or documented.
- No exhaustive assistive-technology or cross-browser compatibility certification was performed. The tested browser was Chrome; Safari and Firefox should be checked as part of launch review if required.
