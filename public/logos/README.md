# Brand marks & imagery

Drop files here and they appear on next reload. Nothing is required — until a
file exists the site renders a monogram in its place, so layout is identical
either way and adding one later never reflows the page.

## Where files go

    public/logos/org/<slug>.<ext>     companies, institutions, projects
    public/media/portrait.<ext>       your photo
    public/media/work/<file>          photos from each role

**The filename must be the slug.** `nse.webp`, not
`nse-national-stock-exchange-of-india5651.webp` — the slug is what the
content file asks for.

Extensions are tried in order: `svg` → `webp` → `png` → `jpeg` → `jpg`.
Portrait: `jpg` → `jpeg` → `png` → `webp`.

## Slugs the site is looking for

    org/   tata-elxsi ✓   nse ✓   partnr ✓   google ✓
           shoppers-stop   teamlease   smlra   kjsce   iitm
           rememly   amlguard   stocksage

✓ = already present.

## Tech stack marks — nothing to do

Stack icons come from the `developer-icons` package (MIT), matched by name in
`src/lib/techIcons.tsx`. Anything not in that map falls back to a monogram.

The map is explicit, not fuzzy, on purpose: a fuzzy match resolves "ChromaDB"
to Chrome and "Streamlit" to Stream. A confidently-wrong logo is worse than
no logo. To add one, check the name exists in the package and add a line.

## Your photo

Square crop, ~600×600, saved as `public/media/portrait.jpg`. Face roughly
centred — it renders in a circle, so anything near the corners gets cut.
Under ~300KB is plenty at the size it displays.

## Sourcing notes

Company and institution marks: use the organisation's own brand asset,
unmodified. Showing an employer's mark to say where you worked is ordinary
practice on a CV; keep it factual, don't restyle it, and remove any mark if
the organisation asks.

Photos: only publish images you took or have the right to use, and check with
anyone identifiable in a workplace photo before it goes on a public site.
