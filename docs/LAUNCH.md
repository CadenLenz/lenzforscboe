# Launch status

The existing public GitHub repository is https://github.com/CadenLenz/lenzforscboe. Cloudflare Pages project lenzforscboe is connected to main with automatic production deployments, no frontend build command, and public/ as output. The production root domain is active with SSL.

D1 database lenzforscboe-endorsements (7ccba6ee-0941-4c84-923a-3bea5cc5a0cb) has the migration applied and is bound as DB in production. Public variables and binding are in wrangler.toml. TURNSTILE_SECRET_KEY, REVIEW_TOKEN_SECRET and EMAIL_API_KEY are encrypted production secrets. The managed Turnstile widget has the root and Pages hostnames configured.

Resend shows lenzforscboe.com verified. Only the three provider-requested DKIM and sending-subdomain SPF/MX records were added; root and www CNAME records are preserved. The existing www 301 rule remains configured to preserve path and query string.

The current source refinements have passed the local checks in TESTING.md. Production release verification is still pending at the time of this pre-release note; a successful build alone does not establish submission, Gmail delivery or moderation.
