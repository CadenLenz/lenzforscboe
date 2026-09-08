# Deployment

Use the existing GitHub repository CadenLenz/lenzforscboe and Cloudflare Pages project lenzforscboe. Push tested commits to main; Cloudflare automatically publishes public/ and compiles functions/. Do not create a duplicate project or switch to manual upload.

The production D1 binding is DB → lenzforscboe-endorsements. The schema lives in migrations/. Public configuration is maintained in wrangler.toml, while Turnstile, Resend and review-token secrets stay encrypted in Cloudflare. Apply migrations explicitly; they do not run during the Git build.

See the README for complete setup and release instructions, docs/TESTING.md for validation, and docs/LAUNCH.md for verified deployment status.
