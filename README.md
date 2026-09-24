# acumen.be — static site (Vercel)

A static (HTML/CSS/JS, no PHP/WordPress/database) export of acumen.be, keeping the same look
without the WordPress+Elementor backend.

- `vercel-site/` — **the site.** The one and only copy; edit pages here directly.
- `docs/` — notes, not deployed:
  - `FORMS.md` — the 34 forms that still need a backend
  - `backlog.md` — content/SEO question backlog for the blog posts
  - `pages.json` — the 55 URLs in scope
  - `sweep*.tsv` — headless-browser sweeps (console errors / failed requests) from the export
    (`sweep4.tsv` is the latest)

## Deploy

```
cd vercel-site
npx vercel          # first deploy — links/creates a project, gives you a preview URL
npx vercel --prod   # promote to production
```

No build step; Vercel's "Other" preset serves it as-is. `vercel.json` sets
`trailingSlash: true` (every page is `<path>/index.html`, so `/foo` → 308 → `/foo/`) and a
sitewide `X-Robots-Tag: index, follow` header.

Local check: `cd vercel-site && python -m http.server 8000`

## Layout (`vercel-site/`)

File path = URL. 55 pages:

- `index.html`, `contact/`, `culture/`, `partners/`, `our-expertise/`, `anaplan*/`,
  `white-paper-download-page/` — top-level pages
- `expertise/` — 8 service pages
- `knowledge/` — blog index + all 32 posts/whitepapers/cases
- `careers/` — careers page + vacatures
- `legal/` — privacy policy, terms & conditions
- `wp-content/`, `wp-includes/`, `assets/` — theme/plugin CSS+JS, uploads, CDN copies. Left at
  WordPress paths on purpose: Elementor's JS builds some asset URLs at runtime from them.

Posts used to live at the root (`/agentic-ai/`) and careers/legal at their WordPress slugs;
`vercel.json` 308-redirects every old URL to its new home, so external links and search rankings
carry over. New post → add `knowledge/<slug>/index.html`, no redirect needed.

Images in `wp-content/uploads/` are WebP (max 2560px wide). The JPG/PNGs still there are
`og:image`/`twitter:image` social previews (kept for link-preview compatibility) or files where
WebP saved <20%. New images: add them as WebP.

Excludes WordPress tag/category/author archive listings — query pages, not authored content.

## Known limitations

- **Forms don't submit.** Every Elementor Pro form POSTs to `/wp-admin/admin-ajax.php`, which
  doesn't exist here; Elementor shows a generic failure message. Each is marked with a
  `TODO(migration)` comment in its HTML — see `docs/FORMS.md`. Wire up Formspree, Vercel
  functions, etc. before relying on them.
- **No `robots.txt` / `sitemap.xml` yet** — add once the final domain is known.
- **RSS/oEmbed/REST discovery links are dead** (`/feed/`, `/wp-json/*`, `/xmlrpc.php`) —
  inert `<link>` tags with no visual effect.
- **`/insights/`** was a WordPress 301 to `/knowledge/`; the nav link now points straight there.
- **Pre-existing content bug in 23 of 32 blog posts:** a shared content block has its
  `<img src>` filled with pasted body text ("AItechnologyiswidelyusedthroughoutindustry...")
  instead of an image URL. Same text verbatim in every affected post — fix it once, the same
  way, across all of them (`grep -rl AItechnologyiswidely vercel-site`).
