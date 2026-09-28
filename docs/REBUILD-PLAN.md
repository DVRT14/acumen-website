# Rebuild plan: remove jQuery + Elementor, pixel-perfect

Goal: same site, same pixels, same motion — without jQuery, Elementor, WordPress JS or the
`wp-*` asset tree. Written 2026-09-24 against commit `6251330`.

## Status

| Phase | State |
|---|---|
| 0 Harness | Done. Deterministic (paused fake clock, seeded `Math.random`, one browser per worker): 0 diffs in 238 tiles between two runs of the flakiest pages. |
| 2 Astro (done before 1, so the JS swap happens in one place) | Done. Build output was byte-identical to the old static site. |
| 1 JS swap | Done (`src/scripts/`). Full 55 × 8 gate: remaining diffs are animation phase/timing (see accepted list) and the one-off pages still to rebuild. |
| 3 Elementor markup/CSS | In progress. Done: header, footer, consent banner, knowledge posts (template 996, 23 pages), expertise pages (template 1047, 7 pages, incl. the expertise slider). Left: whitepaper variants and the one-off pages. |
| 4 Cleanup | — |

### Tooling (in `tools/`)

- `visual/capture.mjs` + `compare.mjs` — the gate (see README).
- `visual/domdiff.mjs` — what scripts change in the DOM after load (used to port Elementor exactly).
- `visual/spec.mjs` — computed-style spec of a subtree per viewport (for rewriting a component).
- `rules.py` — authored Elementor CSS for given element ids, per media query (hover states etc.).
- `outline.py` — container/widget tree of an Elementor document.

### Intentional differences (accepted)

- Resize no longer kills every ScrollTrigger (`textLeftOnScroll*`); only their own triggers rebuild.
- Menu open animation always at 1× speed (was 3× after the first close).
- Consent: banner shown until a choice; preference centre has working category switches; trackers
  load only after consent (no third-party requests by default).
- 23 posts: broken `<img>` with body text as `src` removed (was invisible anyway).
- Forms submit to the stub endpoint and show Elementor's success/error message.
- Marquees measure their text after the web fonts load (the old script measured the fallback font,
  so the loop distance was wrong); their scroll phase differs. Allowed in `tools/visual/allow.json`.
- ScrollTrigger is refreshed once after all handlers ran (the old scripts relied on the window-load
  refresh). Scrubbed headings ("Say hello") can be a few px apart mid-scroll; identical at rest.

## 1. What's there today (measured)

**Pages.** 55 static HTML files, 87–230 KB each. Every file is a full Elementor render: header,
footer, drop-menu, cookie-banner template and ~30 `<link>`/`<script>` tags are duplicated 55×.
Changing the nav means 55 edits.

**JS on every page (~950 KB before gzip, 27 scripts):**

| Script | KB | Needed for |
|---|---|---|
| `hello-theme-child-master/main.min.js` | 267 | the site's own animations (see below) |
| `jquery` + `jquery-migrate` | 101 | Elementor + smartmenus + sticky |
| Elementor + Pro frontend, modules, runtimes, handlers | 177 | widgets below |
| `wp-polyfill*`, `regenerator-runtime`, `hooks`, `i18n` | 67 | Elementor Pro only |
| `jquery-ui/core`, `imagesloaded`, `hello-frontend` | 30 | Elementor only |
| `smartmenus`, `jquery.sticky` | 28 | nav menu, sticky header |
| `gsap` + `ScrollTrigger` + `lenis` | 128 | smooth scroll |
| CookieYes `script.min.js` | 20 | cookie banner (jQuery-free already) |
| lazy: `swiper` 144, `lottie` 253, jet-engine 75 + `slick` 44 | | carousels, lottie, expertise grid |

**`main.min.js` is a Parcel bundle containing a second jQuery (87 KB) and a second GSAP +
ScrollTrigger (~120 KB)**, plus typed.js, split-type and scroll-lock. The actual custom code is
~25 KB across 24 modules. Four modules match nothing on any page and are dead:
`videoPlayOnHover` (`.animatedBtn`), `imagesAnimBottom`, `mobilesAnimation`, `horizontalScroll`.

Consequence of the double GSAP: the inline Lenis setup wires `lenis.on('scroll', ScrollTrigger.update)`
and `gsap.ticker.lagSmoothing(0)` to the *global* GSAP, while every custom animation runs on the
*bundled* copy (which only sees native scroll events). Merging them onto one instance can shift
scrub timing slightly — the harness in Phase 0 has to catch this.

**Custom animation modules actually in use (pages):** headerNav/drop-menu (55), hero clip-path
intro (55), `typingReveal` (55), `animateFromBottom` + form-field stagger (55), marquee (31),
`playInView` / `playInViewRepeat` video (24), `postItem` hover (40), `textLeftOnScroll(Flex)` (14),
typed.js word swap (2), `howWeHelpYou` (2), and one page each for expand-section (split-type),
`sectionDataGroup`, `revealOnHoverSection`, `scrollingText`, `home-scroll_section`,
`playInViewSingle`, `greenSection` header colour switch. Plus `goToSectionOnPageLoad`
(`$('html,body').animate(..., 'slow')`).

**Elementor features that need a replacement:**

| Feature | Pages | Notes |
|---|---|---|
| Sticky header (`sticky: top`, effects offset 100) | 55 | `post-48.css` styles `.elementor-sticky--effects` |
| Entrance animations `fadeIn` / `fadeInUp` | ~86 elements | `elementor-invisible` → `animated <name>` |
| Motion effects, scrolling | 33 elements / 32 pages | + 1 mouse-track; exact math matters |
| Loop carousel (Swiper 8) | 39 | 2 slides, offset right 50px, gap 25px, infinite |
| Nav menu widget (smartmenus) | 55 | inside the custom drop-menu |
| Video widget | 24 | plain hosted video |
| Share buttons | 33 | URLs are built in JS (`share-link.min.js`) |
| Lottie | 9 | settings reference `default.json` — confirm real source |
| Jet listing grid + slick (jQuery plugin) | 7 expertise | `carousel_enabled: yes` |
| Forms | 34 | already broken (no `admin-ajax.php`), see `FORMS.md` |
| Nested tabs | 1 (`anaplan-tabs`) | |
| Popup | 1 | `timing: []` — no trigger, likely dead |

**CSS.** Homepage loads 517 KB across 29 stylesheets + 22 inline `<style>` blocks
(Elementor kit `post-6`, header/footer `post-48`/`post-804`, per-page `post-*.css`,
widget CSS, `block-library` 113 KB, jet-engine 50 KB). Breakpoints: mobile ≤767, tablet ≤1024
(+ custom `xl 1440`, `xxl 1600` in the grid config). Fonts: local DM Sans, Roboto, Atyp.

**Bugs the current site has (decide: keep or fix — they affect "pixel-perfect"):**
1. `textLeftOnScroll(Flex)` on resize calls `ScrollTrigger.getAll().forEach(kill)` — wipes every
   other ScrollTrigger (header colour switch, video play-in-view, reveals) on those 14 pages.
2. 23 blog posts have body text in an `<img src>` (see README).
3. `setDefaultsForVideos` logs to console for every video.
4. gtag (Site Kit), LinkedIn and Leadinfo load before consent — CookieYes doesn't gate them.
   Legal question, not a pixel one; flag to owner.

## 2. Strategy

A full markup + CSS rewrite of 55 pages cannot be pixel-perfect in one step. So: **build the
measuring stick first, then remove things in order of risk, and let the stick decide.**

- Phase 1 removes all jQuery/Elementor **JS** while keeping Elementor **markup and CSS**
  untouched. Low risk, biggest byte win.
- Phase 2 moves to templates so each fix happens once, not 55×. Output HTML must be
  byte-equivalent (normalized) to Phase 1.
- Phase 3 replaces Elementor markup/CSS one template at a time, each gated by zero visual diff.

You can stop after Phase 2 and have a jQuery-free, Elementor-JS-free site that still uses
Elementor's generated CSS classes. Phase 3 is where most of the effort is.

## 3. Phases

### Phase 0 — Verification harness (do first, ~2 days)

`tools/visual/` with Playwright + pixelmatch (dev-only, not deployed).

- **Baseline** = current `main`, served locally. Always capture and compare in the same
  Playwright Docker image (font rendering differs between Windows and Linux).
- **Viewports:** 1920, 1440, 1366, 1025, 1024, 768, 767, 390 (both sides of each breakpoint).
- **Static end-state shots:** block third-party hosts; stop Lenis; step-scroll the whole page so
  every trigger fires; wait for GSAP `globalTimeline` to go idle; mask the non-deterministic
  regions (videos, marquee, typed text, lottie, carousel autoplay, cookie banner); full-page shot.
- **Layout diff:** dump `getBoundingClientRect()` + key computed styles (font, colour, margin,
  padding) for every visible element keyed by DOM path/text. Catches 1px shifts that
  anti-aliasing tolerance hides, and gives an actionable "which element moved" report.
- **Motion checks:** for the animation types above, capture frames at fixed scroll offsets
  (`lenis.scrollTo(y, {immediate: true})` + fixed ticks) and at fixed times after load (hero
  intro). Plus side-by-side screen recordings for human sign-off — motion is judged, not diffed.
- **Gate:** pixelmatch threshold 0.1, 0 differing pixels outside masks, 0 layout deltas > 0.5px,
  0 console errors, 0 failed requests. Anything else is reviewed by eye and explicitly accepted.
- Run the harness twice on the unchanged baseline first; if it isn't stable against itself, fix
  that before anything else.

### Phase 1 — Replace all JS, keep markup + CSS (~5 days)

One ES module `assets/js/site.js`, one self-hosted GSAP + ScrollTrigger + Lenis (already in
`assets/`). Per-page features loaded with dynamic `import()` only when their selector exists.

1. **Port the 20 live custom modules to vanilla** — same selectors, same GSAP params, same
   ScrollTrigger start/end values, line by line. Drop the 4 dead ones.
   - scroll-lock → `lenis.stop()` + `overflow:hidden` + scrollbar-width `padding-right`
     (scroll-lock does this; skipping it shifts the page when the menu opens).
   - `$('html,body').animate(…,'slow')` → `lenis.scrollTo(el, {offset: -headerH, duration: 0.6,
     easing: p => 0.5 - Math.cos(p * Math.PI) / 2})` (jQuery's `slow` + `swing`).
   - Keep typed.js and split-type as-is (small, 2 pages / 1 page, behaviour-identical).
   - Bug 1: keep behaviour-compatible unless you choose to fix it (then accept the diff).
2. **Replace Elementor JS**, reading the same `data-settings` JSON the markup already carries:
   - Sticky header: toggle the same classes (`elementor-sticky--active`, `--effects` after
     100px) via a ScrollTrigger; keep Elementor's spacer so nothing jumps.
   - Entrance animations: IntersectionObserver swaps `elementor-invisible` → `animated fadeInUp`
     honouring `_animation_delay`; keep the existing animation CSS.
   - Motion effects: port Elementor Pro's motion-fx formula verbatim from
     `elements-handlers.min.js` (translate/opacity/scale per viewport range), drive it from
     the same ScrollTrigger/Lenis tick. Verify each of the 33 elements with frame shots.
   - Loop carousel: keep Swiper 8 (standalone, no jQuery), init with the exact config
     Elementor's handler derives from the settings (slidesPerView, spaceBetween, offset, loop,
     speed, breakpoints).
   - Jet listing grid: replace slick with Swiper using the equivalent config; drop jet-engine JS.
   - Nav menu: remove smartmenus; the menu is a vertical list inside the custom drop-menu —
     CSS + the existing toggle cover it. Keep `aria-expanded`.
   - Video widget: write plain `<video>` attributes into the markup.
   - Share buttons: static `<a href>` share URLs.
   - Nested tabs (1 page): ~20 lines with `role="tab"` + arrow-key support.
   - Popup: confirm dead → delete.
   - Lottie: keep lottie-web (same renderer = same pixels), lazy-load in view. Confirm the
     animation file first.
   - Forms: keep markup; native constraint validation; `fetch` to a Vercel function (or
     Formspree) and render Elementor's existing success/error message markup. Decide backend.
   - CookieYes script: keep for now (no jQuery, standalone).
3. **Delete** from every page: jQuery, migrate, all Elementor/Pro JS, wp-polyfills, hooks,
   i18n, jquery-ui, imagesloaded, hello-frontend, smartmenus, sticky, jet-engine JS, slick, the
   inline `elementorFrontendConfig` / `ElementorProFrontendConfig` / jet config blobs, and the
   old `main.min.js`.

Exit: harness green on all 55 × 8; `grep -ri jquery` over pages = 0; JS per page ~150 KB.

### Phase 2 — Templates (Astro, static output, ~3 days)

Astro because it outputs plain static HTML with zero client JS by default and deploys on Vercel
unchanged. No UI framework.

- `layouts/Base.astro` (head, header, drop-menu, footer, cookie banner, scripts).
- Layouts per page type: home, expertise-detail (8), knowledge-index, knowledge-post (32),
  careers, vacancy, legal, plus one-offs (contact, culture, partners, our-expertise,
  expertise index, anaplan ×3, white-paper).
- Blog posts → content collection; body HTML kept verbatim as a fragment for now.
- Page head/SEO (Yoast JSON-LD, OG tags) moved into frontmatter data, rendered identically.
- **Gate:** normalized HTML of every built page equals the Phase 1 page (whitespace/attribute
  order ignored), then harness green. `vercel.json` redirects and headers carried over as-is.

### Phase 3 — Replace Elementor markup + CSS, template by template (~10–15 days)

Order by reuse: header/drop-menu/footer (55) → knowledge post (32) → expertise detail (8) →
careers/vacancy/legal → the one-offs → home last (most animation).

Per template:
1. From the baseline, dump computed styles of every element at each breakpoint (harness script).
2. Write semantic markup + one CSS file per component. Design tokens from the kit (`post-6.css`:
   colours, type scale) as custom properties. Media queries at exactly 767 / 1024 (+1440/1600
   where used). Replace animation hook classes with `data-anim="…"` only if the JS is updated in
   the same step.
3. Iterate until the harness is green for that template at all 8 viewports.
4. Delete the Elementor CSS that template no longer references.

Watch-outs: Elementor containers rely on `--e-con-*` variables, `flex-wrap`, and default
`--widgets-spacing` gaps; heading/text widgets inject margins; `elementor-widget-container`
padding. Reproduce the resulting box model, not the class structure.

Exit: no `elementor`, `e-con`, `jet-` or `wp-` classes in output; CSS per page < ~60 KB.

### Phase 4 — Cleanup + cutover (~2 days)

- Delete `wp-content/plugins`, `wp-content/themes`, `wp-includes`, Elementor font CSS; move
  fonts to `assets/fonts` with the same `@font-face` metrics.
- Keep `wp-content/uploads/` paths (OG images, external hotlinks, Google Images) — or move and
  add a redirect; don't break them silently.
- robots.txt, sitemap.xml, forms live, Lighthouse run, final harness run, deploy preview →
  side-by-side sign-off → prod.

## 4. Decisions (2026-09-24)

1. **Scope:** all phases — Elementor fully gone.
2. **Known bugs 1–3:** fix them; the resulting diffs are accepted (listed in the harness
   allow-list with a reason, never silently).
3. **Tooling:** Astro.
4. **Forms:** backend undecided → stub. All forms `fetch` POST to one Vercel function
   `api/forms.js` that validates required fields, logs the submission and returns 200. The form
   shows Elementor's existing success message. One `TODO(forms-backend)` in that function is
   the only place to change later.
5. **Consent:** fix in Phase 1. Replace CookieYes with our own vanilla banner that keeps the
   **same markup and look** (and the "revisit" button), stores the choice in a first-party
   cookie, and gates trackers:
   - Google Consent Mode v2: `gtag('consent','default', {…: 'denied'})` before gtag loads;
     `update` to granted per category on accept.
   - LinkedIn Insight (advertisement) and Leadinfo (analytics) are not injected at all until
     their category is accepted.
   - Categories as today: necessary (always on), functional, analytics, performance,
     advertisement. "Always Active" labels on non-necessary categories were wrong → real toggles.
   - Harness: consent-denied is the default run; assert zero requests to tracker hosts.

## 5. Risks

- Merging the two GSAP instances shifts scrub feel — caught by frame shots; tune per animation.
- Motion-fx and Swiper parity depend on porting Elementor's exact config/math, not approximating.
- Screenshot flakiness (fonts, video, lazy images) — mitigated by Docker, masks, and a
  self-stability check before any change.
- Phase 3 effort scales with how many one-off layouts exist; the home page alone is large
  (`post-2774.css` 114 KB).
