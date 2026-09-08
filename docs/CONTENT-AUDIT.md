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
| Page 7 branding | Sampled campaign blue/yellow preserved; no extra photo slot |

No dates, endorsers, affiliations, positions or candidate photographs were invented. Both photo locations use white markup placeholders; no sample endorser appears publicly. The additional user-requested heading, Areas of Support and Collaboration, separates the preserved collaboration paragraph. Domain metadata uses https://lenzforscboe.com/.

Run `python tests/content-audit.py` to compare all campaign prose, footer statements, nine sections, corrected role and paragraph, photo placeholders, and local anchors. The source thank-you is preserved in the form script. Form, privacy and workflow language was explicitly extended by the latest user request.
