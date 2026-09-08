# Validation report

## Current refinement validation (September 7, 2026)

- `npm test`: six groups pass using the actual SQL schema in in-memory SQLite. Covers required fields, whitespace/length/email validation, malformed input, origin and content-type boundaries, Turnstile success/action/hostname checks, pending/private records, approval, decline, expired/invalid/consumed tokens, HTML escaping, method restrictions, safe public configuration, email failures and idempotent retries.
- Browser regression: Chrome sends `Origin: null` on the review page's no-referrer POST. Same-origin Fetch Metadata plus the one-time token now permits the confirmation, while cross-site metadata is rejected. A real local browser POST approved a test row; a second browser POST declined another. The public API returned only the approved name and role.
- `python tests/content-audit.py`: passes for all source prose, the corrected SELPA role, corrected endorsement paragraph, exact thank-you/footer wording, nine section IDs and internal anchors. Both supplied photos and the new Board subheading are present.
- `npx wrangler pages functions build --outfile tmp/worker.js`: compiled successfully.
- Chrome local responsive checks at 320, 375, 430, 768, 1024, 1440 and 1920px: document scroll width equals client width at every size. The hero keeps 10:11 and board photo 410:491. System font across every Endorsements descendant is Arial, Helvetica, sans-serif, including the populated approved card.
- Visual review of desktop hero/Experience and narrow mobile form: restrained blue/yellow rules, alternating surfaces, readable headings, authentic supplied photos and consistent controls. The compact light Turnstile widget fixes a detected 320px overflow. At widths below 1600px, Back to top sits after the footer so it cannot cover text or form controls.
- Required-field UI validation identifies name, role, email and consent, focuses the first invalid field, and preserves entries on failure. Local submission displays the exact source thank-you; approved content is loaded automatically after refresh. Local API testing captures email rather than sending it; real email delivery must be established separately on production.

The local browser runtime used an in-memory DB and mock external-service responses; its data is isolated from D1 production. No mock server or test credential is shipped. Screenshots, temporary worker output, test mail and local databases are ignored by Git. No current Lighthouse score is claimed; earlier scores apply only to an earlier version.

Production deployment and delivery verification are recorded in LAUNCH.md after the release.

## Final photo and production verification

Both optimized photos loaded at 320, 375, 430, 768, 1024, 1440 and 1920px without horizontal overflow. Desktop and 320px mobile hero visuals were reviewed; the school board frame preserves the full source photo and nameplate. All nine main navigation links were activated by keyboard and focused the correct destination. The mobile menu opened by keyboard and closed on selection.

Production browser submission passed real Turnstile, stored a pending row in D1 and delivered a moderation email to lenzforscboe@gmail.com, as confirmed by Resend. A controlled approval appeared in the public API with name and role only, then was unpublished. A second controlled submission was declined through its delivered email link and remained private. Both controlled test rows are declined; the separate existing pending submission was left for the campaign to review.
