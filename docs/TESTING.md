# Launch validation

The original site passed six-width browser QA and a local mobile Lighthouse run with scores of 100 for performance, accessibility, best practices and SEO. Those generated reports and screenshots are local-only development artifacts, not production assets or current launch claims.

For this launch update, results are recorded in [LAUNCH.md](LAUNCH.md) after the corrected site is tested locally and on the deployed domains.

Reproduce source and server checks with `npm test` and `python tests/content-audit.py`. The optional `tests/browser.cjs` suite uses Playwright and Chrome against port 4173, mocking Turnstile and the submission API. It never submits real endorsements. Browser QA output belongs in ignored `tmp/`, not in the repository.

Real Turnstile and Google Sheets integration must be tested only after campaign-owned configuration is supplied. The online form deliberately remains disabled until then.
