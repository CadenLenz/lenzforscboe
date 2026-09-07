# GitHub → Cloudflare Pages → campaign domain

## 1. GitHub

Use this directory as the repository root, not the surrounding Playground directory. Create an empty GitHub repository under the intended campaign account. Review `.gitignore` and the staged files before committing. Never add `.dev.vars`, real keys, or test submissions.

```sh
git add public functions tools tests docs README.md package.json wrangler.toml .gitignore .dev.vars.example
git commit -m "Build Jonathan Lenz campaign website"
git branch -M main
git remote add origin https://github.com/CadenLenz/lenzforscboe.git
git push -u origin main
```

The production branch is `main`. Future changes use `git push origin main`.

## 2. Cloudflare Pages

In Cloudflare, create a **Pages** project and connect the GitHub repository. Select:

- Production branch: `main` (or the branch you actually use).
- Framework preset: None.
- Root directory: repository root.
- Build command: leave empty; if a value is required by the dashboard, use `exit 0`.
- Build output directory: `public`.

`wrangler.toml` also sets `pages_build_output_dir = "./public"`. Keep these consistent. Cloudflare compiles `functions/` as Pages Functions; there is no frontend build. `_routes.json` limits function execution to `/api/endorsement`. The rest of the website is served as static assets.

Use Git integration or `npx wrangler pages deploy public --project-name YOUR-PROJECT` for deployment. A dashboard drag-and-drop asset upload does not compile the included Functions and is not the intended deployment path.

Add the server configuration in Pages **Settings → Variables and Secrets**. Configure preview and production separately. Encrypt `TURNSTILE_SECRET_KEY` and `SHEETS_SIGNING_SECRET`; keep `GOOGLE_SCRIPT_URL` server-side as well. Redeploy after changing configuration.

Do not put Google Sheet credentials in repository variables that are interpolated into public JavaScript. The implementation reads server configuration from `context.env` at request time.

## 3. Custom domain

In the Pages project, add the actual domain under **Custom domains** and follow Cloudflare’s DNS validation steps. For an apex domain, the domain normally must be a zone in that Cloudflare account. For a subdomain, follow the Pages-provided CNAME instructions. Add the domain through Pages before manually changing records.

Wait for the domain and HTTPS certificate to become active. The canonical origin is `https://lenzforscboe.com`; and redirect an alternate `www`/apex hostname to that origin using a Cloudflare redirect rule if both are used. Do not configure a campaign domain that the campaign has not supplied.

Set `ALLOWED_ORIGINS` to exact origins such as `https://lenzforscboe.com`, without a trailing slash. The API additionally requires the incoming Origin to match the request URL’s origin. Add a Pages preview origin only if you intentionally enable submissions there; use separate preview credentials and a test Sheet. Never use a wildcard origin.

Add the actual hostname to the Turnstile widget’s allowed hostnames. The function checks both Turnstile’s returned hostname and `action: endorsement`.

## 4. Launch verification

1. Review the headshot and sample endorser placeholders listed in the README.
2. Test all anchor links and the form at the real HTTPS domain.
3. Submit an authorized test endorsement; verify exactly one intended Pending row and remove it manually afterward.
4. Confirm the site did not publish the submitted name automatically and the email is absent from public HTML.
5. Verify metadata, canonical URL, sitemap and robots instructions use the actual domain.
6. Verify response security headers on the deployed site. Pages `_headers` applies to static assets; the Function sets its own no-store, JSON and nosniff headers.
7. Run Lighthouse against the actual deployment, including the configured Turnstile widget.

For extra traffic protection, apply an account-appropriate Cloudflare rate-limit rule to POST requests at `/api/endorsement` and monitor challenge failures. There is no application database or in-memory pseudo-rate-limiter. The supplied protection consists of Turnstile single-use tokens, hostname/action checks, strict same-origin requests, a honeypot, bounded bodies, strict validation and authenticated forwarding. Apps Script quotas remain an external capacity limit.

## References

The configuration follows [Cloudflare Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/), [Pages Functions setup](https://developers.cloudflare.com/pages/functions/get-started/), and [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). These were checked during implementation on September 6, 2026. Dashboard labels may change; the configuration values above are the relevant settings.
