# Launch status

The existing public GitHub repository is https://github.com/CadenLenz/lenzforscboe. Cloudflare Pages project lenzforscboe is connected to main with automatic production deployments, no frontend build command, and public/ as output. The production root domain is active with SSL.

D1 database lenzforscboe-endorsements (7ccba6ee-0941-4c84-923a-3bea5cc5a0cb) has the migration applied and is bound as DB in production. Public variables and binding are in wrangler.toml. TURNSTILE_SECRET_KEY, REVIEW_TOKEN_SECRET and EMAIL_API_KEY are encrypted production secrets. The managed Turnstile widget has the root and Pages hostnames configured.

Resend shows lenzforscboe.com verified. Only the three provider-requested DKIM and sending-subdomain SPF/MX records were added; root and www CNAME records are preserved. The existing www 301 rule remains configured to preserve path and query string.

Production release 65e417e deployed successfully. The public domain, assets and enabled endorsement API were verified. HTTPS www redirects to the root domain with path and query preserved. Real browser submissions, D1 pending storage, Resend-confirmed delivery to the campaign Gmail address, approval publication and decline were verified. Both controlled test endorsements are declined and absent from the public API. The campaign's separate pending submission remains available for review.

The final photo update includes both supplied photographs, optimized without embedded camera metadata. All seven requested viewport widths and keyboard section navigation passed. GitHub main triggers the final photo deployment; verify its exact commit in the Cloudflare deployment status before handoff. No campaign configuration action remains.

Final public-access cleanup: five explicitly identified test records were deleted after campaign approval of the workflow; other submissions are preserved. No account, email allowlist, or login is required for public submissions. Turnstile remains active for spam prevention. All script and stylesheet URLs are versioned to replace cached pre-release assets. Review email subjects now identify the submitted name. Previously delivered test emails are historical messages and their deleted records can no longer be moderated.
