# acumen.be — static site (Astro on Vercel)

A static rebuild of acumen.be without WordPress, Elementor or jQuery. Every page is a hand-written
Astro page. Most pages keep the old look and motion (see `docs/REBUILD-PLAN.md` for how, and what
differs on purpose); the knowledge posts (customer cases, blogs, white papers) and the partners pages
were redesigned on 2026-09-29.

- `vercel-site/` — **the site** (an Astro project).
- `tools/visual/` — visual regression harness (dev only, not deployed).
- `docs/` — notes, not deployed:
  - `CONTENT.md` — **how to add/edit content**: knowledge posts, authors, partners, page SEO; open content items
  - `REBUILD-PLAN.md` — the Elementor/jQuery removal plan and decisions
  - `FORMS.md` — the site's forms and their webhook identifiers
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

- `src/pages/` — one Astro page per layout; `src/components/` — header, footer, consent banner,
  cards, carousels, post blocks.
- `src/content/knowledge/*.md` — knowledge posts (customer cases, blogs, white papers): Markdown with
  frontmatter, schema in `src/content.config.ts`. Listings, related posts and carousels are generated
  from it (`src/lib/knowledge.ts`); add a post by adding a file (see `docs/CONTENT.md`).
  `src/pages/knowledge/[slug].astro` picks the layout per `type` from `src/components/knowledge/`
  (`CaseStudy`, `Blog`, `Whitepaper`, plus `LeadForm`, `Breadcrumbs`, `Faq`, `AuthorBox`).
- `src/data/authors.json` — post authors (author pages: `src/pages/knowledge/authors/[id].astro`);
  `src/data/partners.json` — partner cards and pages (`src/pages/partners/[slug].astro`).
- Other `src/content/`, `src/data/` — page content as JSON (text, image attributes, `seo` object);
  edit these for content changes. The head (meta, Open Graph, JSON-LD) is built by `src/layouts/Base.astro`.
- Buttons: one shared system in `src/styles/base.css` — `.btn` (primary on light), `.btn--outline`,
  `.btn--on-dark` and `.btn--outline-on-dark` (on green surfaces). Don't add per-page button styles.
- `src/styles/` — plain CSS per page/component (Elementor's layout rules, written out; the redesigned
  knowledge layouts use `case.css`, `blog.css`, `whitepaper-page.css`).
- `src/scripts/` — the whole runtime, bundled by Astro:
  - `site.js` — entry
  - `scroll.js` — the single GSAP + ScrollTrigger + Lenis instance
  - `animations.js` — the site's own animations (ported from the old theme bundle). ScrollTrigger and
    SplitType load only on pages that need them: a new scroll-driven animation must add its selector to
    `SCROLL_TRIGGER_HOOKS` at the top of the file, or it won't run on pages without the other hooks.
  - `widgets.js` — widget behaviour from data attributes (sticky elements, entrance animations,
    motion effects, carousels, tabs, share buttons, lottie, forms)
  - `consent.js` — cookie consent and tracker loading
- `src/components/ConsentBanner.astro` — consent banner/preferences markup.
- `api/forms.js` — Vercel function every form posts to (forwards to a webhook, see below).
- `public/` — static files served as-is: uploads keep their WordPress paths (`/wp-content/uploads/`)
  so OG images and external links don't break; the Elementor, theme and `wp-includes` files are gone.

Runtime libraries are pinned to exact versions in `package.json` — the visual parity was checked
against those versions.

## Consent and trackers

Nothing third-party loads before consent. `consent.js` loads the Google tag (`GT-57V29WMM`) +
GTM (`GTM-K9LS6TDR`) after **Analytics** consent and LinkedIn Insight after **Advertisement**
consent, with Google Consent Mode v2 set accordingly. The choice is stored in the
`cookieyes-consent` cookie (same format as the old CookieYes plugin, so earlier choices still count).
Tracker IDs live at the top of `consent.js`.

## Forms

All forms POST (FormData) to `/api/forms` and show a success/error message (per-form text via `data-success`; list in `docs/FORMS.md`).
The endpoint validates the submission and forwards it as JSON to the webhook in the Vercel env var
**`FORMS_WEBHOOK_URL`** (e.g. a Power Automate "When an HTTP request is received" flow that mails
it or adds it to a list). Payload: `{ form_id, page, fields: {name: value}, files: [{field, name,
type, size, data (base64)}], at }`; `files` carries the vacancy forms' CV (4 MB request limit).
Until that variable is set, or when the webhook fails, visitors get the error message and the
fields (not the files) are only in the function log. Check: `node tools/forms-check.mjs`.

## SEO

`Base.astro` builds the whole head from each page's `seo` data (`{ title, description, image,
published, modified, noindex, lang }`; knowledge posts: from their frontmatter): title, description,
robots, canonical, Open Graph/Twitter, and one JSON-LD graph with Organization, WebSite, WebPage and
BreadcrumbList, plus Article/BlogPosting (author = Person with their author page, or the Organization)
and FAQPage on posts that have `faq`. Author pages add ProfilePage + Person. No Yoast output remains.
`<html lang>` is `en-GB` unless `seo.lang` says otherwise (`nl-BE` on the Dutch vacancies and the
RIZIV post). Author pages are `noindex` until the author has a bio.
`sitemap.xml` and `robots.txt` are written after the build (`astro.config.mjs`) from the built
pages (lastmod from `article:modified_time`), leaving out `noindex` ones (`/anaplan-tabs/`,
`/anaplan-market/`, author pages without a bio). All absolute URLs use
`https://acumen.be` (the live canonical host). `vercel.json` sends `X-Robots-Tag: noindex` on every
host except `acumen.be`, so dev/preview deploys stay out of search and the live domain needs no switch.
Old WordPress `/category/`, `/tag/`, `/author/` archives 301 to `/knowledge/`.

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
Options: `--pages knowledge,contact` (substring filter; `=/knowledge/` matches exactly), `--vp 1440,390`, `--workers 8`, `--resume`.
Intentional differences go in `allow.json` with a reason: per page/tile, or `{ "text": regex }` for a
continuously animated text (its layout and its rows of pixels are then ignored).
The redesigned pages (knowledge posts, knowledge index cards, partners, home tools/benefits markup)
no longer match the baseline by design; compare them against a fresh candidate capture instead.
`docs/pages.json` lists the 55 original URLs; the new partner and author pages aren't in it.

## Known limitations

- **RSS/oEmbed/REST discovery links are dead** (`/feed/`, `/wp-json/*`, `/xmlrpc.php`) —
  inert `<link>` tags, removed in Phase 3.
- **No newsletter sign-up:** removed on purpose (2026-09-29, Acumen no longer sends a newsletter).
  The old post template's form (`e914a34`) and its component/styles are deleted. The privacy policy
  text (`src/content/pages/legal~privacy-policy.json`) may still mention the newsletter.
- **Content that needs the site owner** (author facts, client quotes/logos, whitepaper covers, …):
  see `docs/CONTENT.md` → Open content items.
