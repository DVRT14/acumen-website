# acumen.be — static site (Astro on Vercel)

A static rebuild of acumen.be: same look and motion as the old WordPress + Elementor site,
without WordPress, Elementor or jQuery at runtime. The rebuild is in progress — see
`docs/REBUILD-PLAN.md` for phases and status.

- `vercel-site/` — **the site** (an Astro project).
- `tools/visual/` — visual regression harness (dev only, not deployed).
- `docs/` — notes, not deployed:
  - `REBUILD-PLAN.md` — the Elementor/jQuery removal plan and decisions
  - `FORMS.md` — pages with a form
  - `backlog.md` — content/SEO question backlog for the blog posts
  - `pages.json` — the 55 URLs in scope (also drives the harness)

## Develop / deploy

```
cd vercel-site
npm install
npm run dev         # http://localhost:4321
npm run build       # → dist/
npx vercel          # preview deploy
npx vercel --prod   # production
```

Vercel builds it with the Astro preset (`vercel.json` sets `framework: astro`, plus
`trailingSlash`, cache headers and the 308 redirects from old WordPress URLs).

## Layout (`vercel-site/`)

- `src/legacy/*.html` — pages not yet converted: the exported WordPress HTML with the old runtime
  stripped out. File name = route, `~` = `/` (`knowledge~agentic-ai.html` → `/knowledge/agentic-ai/`).
  Rendered verbatim by `src/pages/[...slug].astro`, which appends the consent banner and the
  site script. Converted pages move to real Astro pages/components (Phase 3).
- `src/scripts/` — the whole runtime, bundled by Astro:
  - `site.js` — entry
  - `scroll.js` — the single GSAP + ScrollTrigger + Lenis instance
  - `animations.js` — the site's own animations (ported from the old theme bundle)
  - `elementor.js` — replacements for Elementor/Pro/JetEngine behaviour (sticky header, entrance
    animations, motion effects, carousels, tabs, share buttons, lottie, forms)
  - `consent.js` — cookie consent and tracker loading
- `src/components/ConsentBanner.astro` — consent banner/preferences markup.
- `api/forms.js` — Vercel function every form posts to (a stub for now, see below).
- `public/` — static files served as-is (`wp-content/uploads` images keep their WordPress paths
  so OG images and external links don't break).

Runtime libraries are pinned to exact versions in `package.json` — the visual parity was checked
against those versions.

## Consent and trackers

Nothing third-party loads before consent. `consent.js` loads the Google tag (`GT-57V29WMM`) +
GTM (`GTM-K9LS6TDR`) after **Analytics** consent and LinkedIn Insight after **Advertisement**
consent, with Google Consent Mode v2 set accordingly. The choice is stored in the
`cookieyes-consent` cookie (same format as the old CookieYes plugin, so earlier choices still count).
Tracker IDs live at the top of `consent.js`.

## Forms

All forms POST (FormData) to `/api/forms` and show Elementor's success/error message markup.
The endpoint is a **stub**: it validates, logs the submission and returns success. Wire the real
delivery at `TODO(forms-backend)` in `vercel-site/api/forms.js`.

## Visual regression harness (`tools/visual/`)

```
cd tools/visual && npm install && npx playwright install chromium
node capture.mjs --root ../../.baseline/vercel-site --out out/baseline   # reference
node capture.mjs --root ../../vercel-site/dist --out out/candidate        # after npm run build
node compare.mjs --a out/baseline --b out/candidate --consent denied --allow allow.json
```

`.baseline/` is a git worktree of the pre-rebuild site (`git worktree add .baseline 6251330`).
Each page is captured in viewport-sized tiles at 8 widths with a paused, deterministic clock;
`compare.mjs` diffs pixels and text/image positions and writes `out/report/index.html`.
Options: `--pages knowledge,contact` (substring filter), `--vp 1440,390`, `--workers 8`, `--resume`.
Intentional differences go in `allow.json` with a reason.

## Known limitations

- **No `robots.txt` / `sitemap.xml` yet** — add once the final domain is known.
- **RSS/oEmbed/REST discovery links are dead** (`/feed/`, `/wp-json/*`, `/xmlrpc.php`) —
  inert `<link>` tags, removed in Phase 3.
- **The whitepaper popup** on `/knowledge/de-riziv-controleshoft-is-ingezet/` has no trigger on
  the old site either, so it never opens.
- **Missing image in 23 of 32 blog posts:** a shared content block had its `<img src>` filled
  with pasted body text ("AItechnologyiswidelyusedthroughoutindustry..."), so it never showed
  anything. The broken `<img>` was removed (image widget `cc67132`, the motion-effects block
  after the marquee); add the intended image there once known.
