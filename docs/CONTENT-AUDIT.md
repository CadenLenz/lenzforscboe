# Content integrity audit

The supplied campaign-content PDF remains authoritative, with two explicit user corrections applied for launch:

1. The role reads **Special Education Local Plan Area (SELPA) Director**.
2. The endorsement paragraph ends **community partners.** The trailing word from the PDF was removed; no continuation was added.

`source-extract.txt` is the PDF transcription with these two user-authorized corrections applied. All unrelated substantive campaign copy is preserved.

| Section | Status |
| --- | --- |
| Home | Included; exact office and message, white Headshot here placeholder |
| Meet Jonathan Lenz | All five paragraphs included |
| Experience at Every Level | All seven roles and descriptions included; corrected SELPA expansion |
| Why I Am Running | All four paragraphs included |
| Role of the County Board of Education | Comparison, four authorities and collaboration paragraph included |
| Ready to Serve | Complete source paragraph included |
| Endorsements | Introduction and corrected paragraph included; identification disclaimer, form and exact thank-you preserved |
| Donations | Both source paragraphs included; no payment integration |
| Contact | Source wording and email included |
| Paid-for footer | Exact statement included in one visible location |
| Non-affiliation disclaimer | Exact statement included |
| Page 7 branding | Supplied raster and sampled blue/yellow preserved |

No dates, endorsers, affiliations, positions or candidate photographs were invented. The sample endorser remains explicitly labeled. The hero uses an 800 × 880 white SVG placeholder with centered “Headshot here” text, rendered in the same 10:11 frame that the final portrait will use. Domain metadata uses https://lenzforscboe.com/.

Run `python tests/content-audit.py` to compare the full prose, footer and anchor structure. It also checks the exact corrected role and paragraph and the headshot asset.
