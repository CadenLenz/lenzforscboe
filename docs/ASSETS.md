# Campaign assets and headshot

## Replace the headshot

The one image location is the `.portrait img` in `public/index.html`:

```html
<img src="/assets/images/headshot-placeholder.svg" width="800" height="880" alt="Headshot here" />
```

1. Save the authorized portrait as `public/assets/images/jonathan-headshot.webp`, preferably **800 × 880 pixels (10:11)** or a larger image with the same ratio.
2. Change only `src` to `/assets/images/jonathan-headshot.webp` and `alt` to `Jonathan Lenz`. Keep width="800", height="880" and the `.portrait` figure.
3. Preview phone and desktop crops. The CSS frame has `aspect-ratio: 10 / 11`; the image fills it with `object-fit: cover`. This preserves the same layout space before and after replacement, without stretching. Adjust `object-position` only if the portrait composition needs it.

The supplied placeholder is a white 800 × 880 SVG with centered “Headshot here” text. Its border is provided by the figure. It scales in the same frame on every viewport and has no broken-image treatment or invented photograph. No second image location needs editing.

## Branding

`public/assets/campaign-artwork.webp` is a WebP conversion of the raster image on PDF page 7, originally 2048 × 1536. Dominant colors measured from the embedded image are blue `#003f7f` and yellow `#ffde59`. Supporting dark blue and neutral colors are design additions, not new campaign claims. The website uses system fonts.

The raster retains tiny source template text (“YOUR PARAGRAPH TEXT”) above the office band. A clean campaign export can replace it later. It has not been silently retouched. `favicon.svg` is a simple JL initials treatment in the source colors, not an extracted official vector logo.
