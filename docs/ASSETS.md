# Campaign assets

## Supplied branding

`public/assets/campaign-artwork.webp` is a WebP conversion of the sole raster image embedded on page 7 of the supplied PDF. Original dimensions: 2048 × 1536. The design does not claim that the artwork is a newly authoritative vector logo.

The two dominant campaign colors were measured from the embedded pixels:

- Blue: RGB 0, 63, 127 → `#003f7f`.
- Yellow: RGB 255, 222, 89 → `#ffde59`.

The darker blue and neutral surfaces are supporting design colors. Blue/yellow are the source identity. The page uses system sans-serif fonts and no remote font requests.

The source raster contains tiny template text (“YOUR PARAGRAPH TEXT”) above the blue office band. It remains present in the original supplied graphic; it has not been silently retouched. A final clean campaign artwork export is recommended before launch. The header and portrait placeholder are typographic treatments using the campaign name and sampled colors, not an assertion of an official new logo.

`favicon.svg` is a simple new JL initials treatment in the supplied colors; it is not an extracted official campaign mark.

## Candidate portrait placeholder

No candidate photographs were supplied. The hero intentionally contains a labeled blue placeholder instead of stock photography or an invented likeness.

When an authorized image is available:

1. Save an optimized portrait as `public/assets/jonathan-hero.webp` (roughly 800–1200px wide).
2. Replace the contents of the `.portrait` figure with an image whose alt text is `Jonathan Lenz` and whose width/height match the actual image. Remove “Candidate photo forthcoming.”
3. Adjust `.portrait` for the real photo: remove placeholder padding, use a deliberate aspect ratio, and set the image to width/height 100% with `object-fit: cover` and an appropriate `object-position`. Retain a reasonable hero height on phones.
4. Do not lazy-load the hero portrait. If a second portrait is later added below the fold, use `loading="lazy"`, set dimensions, and test its crop at phone and desktop sizes.

The current contact artwork is lazy-loaded and has explicit width and height. No generated social-preview image is included because one was not requested. Text-only Open Graph and Twitter metadata are present.
