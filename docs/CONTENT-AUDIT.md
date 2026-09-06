# Source-content integrity audit

Source: `Website Content - Google Docs.pdf`, seven pages. Its written content is authoritative; PDF layout directions such as “To include,” “Need an endorse me button,” and sample names are planning material, not public campaign claims. The pasted user request determines the actual implementation requirements.

| Source section | Result | Location / treatment |
| --- | --- | --- |
| Home | Included | Candidate name, exact office and message; explicit photo placeholder |
| Meet Jonathan Lenz | Included | All five narrative paragraphs; source-worded pull quote |
| Experience at Every Level | Included | All seven roles and their complete descriptions; no invented dates or chronology |
| Why I Am Running | Included | All four paragraphs, with a source-worded pull quote |
| Role of the County Board of Education | Included | Complete local/county distinction, four authority definitions, and collaboration paragraph |
| Ready to Serve | Included | Complete paragraph, including 23 years experience |
| Endorsements | Included with source defect flagged | Complete introduction, unfinished second paragraph preserved with an explicit completion marker, reusable sample component, identification-only disclaimer, CTA and exact thank-you text |
| Donations | Included | Heading and both supplied sentences/paragraphs; no payment services |
| Contact | Included | Let’s Connect heading, complete contact wording and campaign email |
| Paid-for footer | Included | Exact sentence in a single visible `#paid-for` element |
| Non-affiliation disclaimer | Included | Exact sentence in `#campaign-disclaimer` |
| Page 7 branding | Included | Supplied raster converted to WebP; dominant source blue/yellow used as design tokens |

## Explicit unresolved source issues

The second endorsement paragraph ends with:

> Together, we believe in thoughtful, student-centered leadership, strong public schools, and a County Board of Education that works collaboratively with the County Superintendent of Schools, local school districts, families, and community partners to

The user confirmed on September 6, 2026 that it is currently incomplete. Its supplied fragment remains in the draft followed by `[Statement awaiting completion.]`. No continuation was invented. Complete or explicitly authorize removing this fragment before public launch.

No real endorsers, candidate portrait, campaign domain, Turnstile keys or Google Sheet destination were supplied. Those are documented placeholders, not factual campaign claims. Three repeated sample endorsement slots in the PDF are represented by one clearly labeled reusable sample; none represents a real person.

The page 7 raster includes tiny template text, documented in ASSETS.md. The raw artwork is preserved rather than silently retouched.

## Permitted formatting changes

- Removed PDF line wrapping and bullets that were layout instructions; maintained complete substantive paragraphs.
- Used typographic quotation marks and heading capitalization. The quoted fragment beginning “Always” capitalizes the source’s “always” because it starts a displayed quotation.
- Used short navigational labels and explanatory headings derived from the corresponding source text; no new positions, statistics, dates, endorsements, affiliations or employment history.
- Preserved “judgement,” “23 years experience,” and the repeated “decision” phrasing in the supplied thank-you message rather than silently editing them.
- Added implementation-based privacy language, field consent and availability/error messages as requested. These are operational descriptions, not additional campaign positions.

All substantive PDF campaign prose is accounted for. The unfinished endorsement wording is the only copy that cannot be made publication-complete without additional campaign text.
