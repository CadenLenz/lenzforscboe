# Endorsement setup and moderation

## Data flow

Browser → same-origin Cloudflare Pages Function → server-side Turnstile verification → HMAC-signed Apps Script request → private Google Sheet → manual campaign review → deliberate HTML update.

No API reads public endorsements. No submission automatically becomes public. The browser never receives the Apps Script URL, signing secret, Sheet ID or Turnstile secret.

## Google Sheet and Apps Script

1. Create a private campaign-owned Google Sheet. Limit editor access to people handling moderation. Do not publish the Sheet to the web or enable public link access.
2. Open **Extensions → Apps Script** and paste `tools/google-apps-script.gs` into the script project.
3. Under **Project Settings → Script Properties**, set `SHEET_ID` to the ID from the Sheet URL and `SHEETS_SIGNING_SECRET` to a cryptographically random secret. Generate one locally, for example:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   This command prints a newly generated secret to your terminal. Copy it only into Apps Script Properties and Cloudflare secret settings, then clear it from any shared terminal transcript. Never commit it.

4. Run `setupSheet()` once and authorize its Sheet access. It creates an `Endorsements` tab if absent, with Timestamp, Name, Affiliation, Email, Consent, Moderation Status and Submission ID columns. Do not change this tab name or column order without updating the script.
5. Deploy the script as a **Web app**, executing as the campaign account, with access set to **Anyone** so Cloudflare can reach it. This exposes an HTTP receiver, not the Sheet. The receiver refuses unsigned, altered and expired requests. Some managed Google accounts prohibit this deployment mode; use an account whose administrator allows it.
6. Copy the deployment `/exec` URL into Cloudflare’s `GOOGLE_SCRIPT_URL`. Do not use the development `/dev` URL.
7. Copy the same secret into Cloudflare’s `SHEETS_SIGNING_SECRET`.

The script verifies the HMAC before processing personal fields, enforces a five-minute signed-request window and serializes writes using a script lock. Column G stores a random, non-personal submission ID for replay detection. Do not remove these IDs from the moderation queue while retaining the corresponding row. Raw form strings are neutralized before insertion so leading spreadsheet formula characters cannot execute as formulas.

The HTTP response reports `{ "ok": true }` only after the row has been appended (or the same signed request was already recorded). Other cases return `{ "ok": false }`; Cloudflare interprets that as a failure, even if Google’s HTTP status is 200. The script never returns submitted values.

Updating Apps Script source requires **Deploy → Manage deployments → Edit → New version** for the web app to use the new code. Preserve the URL or update the Cloudflare secret if you create a new deployment.

## Turnstile

1. Create a Cloudflare Turnstile widget using Managed mode and add the real campaign hostname.
2. Put the **public site key** in `TURNSTILE_SITE_KEY` at the top of `public/js/endorsements.js`.
3. Store the **secret key** as `TURNSTILE_SECRET_KEY` in the Pages environment. It must not appear in public files.
4. Set `ALLOWED_ORIGINS` to the exact HTTPS campaign origin(s). Redeploy.

The widget loads only after a public key is configured. Submission is enabled after verification. Tokens expire and are single-use. After a submitted request, the UI clears the used token and resets the widget. On a failed request, the entered fields remain so the visitor can verify again and retry. The server checks `success`, hostname and `endorsement` action; it does not trust a client assertion that a check passed.

Use a separate test Sheet for local or preview testing. Cloudflare’s official test keys have special verification behavior; the production hostname/action checks must remain intact. Automated tests in this repository mock the external services instead of adding a production bypass. A successful mocked test does not demonstrate live credential wiring.

## Moderation and public updates

Review Pending submissions for consent and whether the person’s supplied affiliation is appropriate to display. Use the moderation column to record your decision. An Approved value in the Sheet does **not** publish anything.

To publish an approved endorsement, edit `public/index.html` in the Endorsed By area:

```html
<article class="endorser">
  <strong>Approved name</strong>
  <span>Approved title or affiliation</span>
</article>
```

The words above are structural examples, not endorsers. Replace them only with verified, approved information. Remove the sample Placeholder article when adding real endorsements. Keep “Titles and organizational affiliations are provided for identification purposes only.” Do not add email addresses. Optional future photos should have appropriate alt text, fixed dimensions and lazy loading.

If a response is lost after a Sheet write, a visitor may submit again with a new token, creating a second Pending row. Moderators should check for duplicate people. Signed-request replay is deduplicated, but this intentionally simple architecture does not maintain a cross-session identity database.

## Privacy and operation

The Sheet stores only the submitted name, optional affiliation, optional email, consent, timestamp, Pending status and a random submission ID. The application does not store raw tokens or visitor IP addresses in the Sheet and does not log submission payloads. Cloudflare and Google still process requests as service providers. The privacy disclosure describes the implementation without promising a legal compliance status or a retention schedule the campaign has not adopted.

The campaign controls Sheet access, manual corrections and deletion. Rotate the signing secret in both services together if needed. Review Apps Script executions and Cloudflare failures without logging raw form bodies or secrets. A secret change or deployment failure must never result in bypassing verification.

Setup references: [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web), [Content Service](https://developers.google.com/apps-script/guides/content), and [Cloudflare server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
