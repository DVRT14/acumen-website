# Content guide

How to add and edit content. Everything lives in `vercel-site/src/`; after a change, `npm run build`
validates it (a frontmatter error fails the build with the file and field name).

## Knowledge posts (`src/content/knowledge/*.md`)

One Markdown file per post; the file name is the URL (`kaneka-powerbi-sap-datasphere.md` →
`/knowledge/kaneka-powerbi-sap-datasphere/`). The schema is `src/content.config.ts`. Adding a file is
all it takes: the knowledge index, related posts, the home and expertise carousels and the sitemap
pick it up.

`type` picks the layout:

| `type` | Layout | Page |
|---|---|---|
| `case` | `components/knowledge/CaseStudy.astro` | hero, key results band, fact box, body, client quote, CTA |
| `blog` | `components/knowledge/Blog.astro` | hero + byline, key takeaways band, sidebar (contents, topics, share), body, FAQ, lead form, author box, CTA |
| `whitepaper` | `components/knowledge/Whitepaper.astro` | intro + "what's inside", download form card, CTA |

Case and blog share `styles/case.css`; blog extras are in `styles/blog.css`, whitepaper styles in
`styles/whitepaper-page.css`.

### Frontmatter

Common fields:

```yaml
---
type: "blog"                      # case | blog | whitepaper
title: "Dagster vs Airflow: …"    # the H1 and card title (plain text)
subtitle: "…"                     # optional, shown under the H1
seoTitle: "…"                     # optional <title>; default "<title> | Acumen"
description: "…"                  # meta description (~150 characters)
excerpt: "…"                      # optional card/lead text; falls back to description
date: 2025-01-16T09:00:00.000Z    # published
updated: 2025-02-01T09:00:00.000Z # optional; shown when > 1 day after date
author: "joris"                   # id in src/data/authors.json; default "acumen"
tags: ["Dagster", "Data engineering"]
lang: "nl-BE"                     # only for Dutch posts (UI strings switch to Dutch)
image:                            # hero + card image (decorative)
  src: "/wp-content/uploads/…webp"
  width: 1748
  height: 2560
  srcset: "… 1748w, … 768w"       # optional
ogImage: "/wp-content/uploads/….jpg"  # share image; use jpg (LinkedIn ignores webp)
cta:                              # optional; each layout has a default
  title: "Want our AI expertise in your organization?"
  text: "Reach out below!"
  label: "Get in touch"
  href: "/contact/"
noindex: true                     # optional
---
```

Keep **tags** to the existing set so related posts stay meaningful: AI, Agentic AI, Power BI,
Microsoft Fabric, Databricks, Dagster, SAP, Data platform, Data engineering, Data integration,
Data governance, Data strategy, ESG & CSRD, Support. Related posts are ranked by shared tags, then
same type, then date (`src/lib/knowledge.ts`).

Per type:

```yaml
# case
client: "Kaneka"
clientLogo: { src: "/wp-content/uploads/2024/08/kaneka.webp", alt: "Kaneka logo", width: 162, height: 78 }
industry: "Manufacturing (plastic components)"
technologies: ["SAP Datasphere", "Power BI"]
results:                          # only real, stated figures
  - { value: "50,000+", label: "configuration variations evaluated" }
quote: { text: "…", author: "Name", role: "Role, Company" }

# blog
takeaways:                        # 3–4 sentences, only what the post says
  - "…"
faq:                              # rendered as an FAQ section + FAQPage JSON-LD
  - { q: "…", a: "…" }
form: { … }                       # optional lead form, see below

# whitepaper
highlights: ["…", "…"]            # "What's inside"
cover: { src: "…", alt: "", width: 800, height: 1000 }  # optional; falls back to image
form:                             # the download form (required for whitepapers)
  name: "Whitepaper Power BI"     # form name as the webhook receives it
  post_id: "3537"                 # hidden fields that identify the submission — keep them stable
  form_id: "317928dc"
  queried_id: "3533"
  referer_title: "…"              # optional; default the page's seoTitle/title
  title: "Meer weten?"            # blog lead forms only: heading + text above the form
  text: "…"
  submit: "Download de whitepaper (NL/FR)"   # optional button label
  fields:                         # optional; default First name, Last name, Email
    - { label: "Naam", name: "form_fields[name]" }
    - { label: "E-mail", name: "form_fields[email]", type: "email" }
```

For a new form, pick a new unique `form_id`; `post_id`/`queried_id` only need to be consistent
per form so submissions can be told apart in the webhook.

### Body

Plain Markdown: `##` sections (they become the blog's table of contents when there are ≥3), `###`
sub-headings, lists, `> quote` (a lime quote card), images `![alt text](/wp-content/uploads/…)`.
Write real lists and headings — no "•" lines or bold paragraphs used as headings.

`agentic-ai.md` has `custom: true`: it is listed like a post, but its page is hand-built
(`src/pages/knowledge/agentic-ai.astro`).

## Authors (`src/data/authors.json`)

```json
{ "id": "niels-donders", "name": "Niels Donders", "role": "…", "bio": "…",
  "image": "/wp-content/uploads/….webp", "linkedin": "https://www.linkedin.com/in/…" }
```

Every non-organisation author gets a page at `/knowledge/authors/<id>/` (ProfilePage + Person
JSON-LD). **An author page stays `noindex` until it has a `bio`.** Role, photo and LinkedIn show in
the post byline and author box when present. `"org": true` marks Acumen itself as author.

## Partners (`src/data/partners.json`)

One entry per partner: overview card (`summary`, 2–3 sentences) and a page at
`/partners/<slug>/` (`src/pages/partners/[slug].astro`): logo, sections, related expertise, related
knowledge posts (by `tags`), external link, optional deep-dive link (Anaplan → `/anaplan/`).
Adding an entry adds the card and the page.

## Culture & vacancies

- Vacancies: one JSON per role in `src/content/vacatures/` (Dutch). Adding a file adds the page
  (`/careers/<file>/`, with JobPosting JSON-LD) and its row on `/culture/#careers`; `seo.lang: "nl-BE"` shows
  "Dutch-speaking" on the row. With no files, the culture page shows an open-application state.
  Google also wants a closing date, employment type and ideally a salary range for job listings; none of
  these are in the files yet.
- Culture copy: `src/content/one-off/culture.json` (story chapters, team) and the hero/careers text in
  `src/pages/culture.astro`. Never write that employees can become shareholders; use the "knowledge
  holder" framing. The "How we hire" steps and "About 45 experts" need owner confirmation.

## Other pages

Page text is JSON in `src/content/` and `src/data/` (home: `content/one-off/index.json`, expertise
pages: `content/expertise/*.json`, vacancies: `content/vacatures/*.json`, legal:
`content/pages/*.json`). The SEO for pages without their own file is in `src/data/meta.json`:

```json
"partners": { "seo": { "title": "Partners - Acumen", "description": "…", "image": "…", "modified": "…" } }
```

`seo` also takes `noindex`, `lang` and `published`. `Base.astro` builds all head tags and the
JSON-LD from it (Organization, WebSite, WebPage, BreadcrumbList; Article/BlogPosting and FAQPage on
posts). Breadcrumbs derive from the URL (`SECTIONS` in `Base.astro` names the sections).

## Open content items (need the site owner)

- **Authors:** surnames for Arin, Joris, Karsten, Yves; roles for most authors (confirm Hilde
  "Functional Analyst", Tjomme "Data Engineer", and that `Group-1491-1-260x300.webp` is Tjomme); bios,
  photos and LinkedIn URLs for everyone.
- **Cases:** real client quotes (all six quotes are Acumen's voice); quantified results (only Animo
  has one; confirm Spaas' "Daily refresh" as a key figure); logos for Animo, Bionerga, Spaas;
  higher-resolution Kaneka / H.Essers logos; the jump-start case names no client.
- **Whitepapers:** real cover images (`cover`); page counts if you want them shown.
- **Partners:** check the IBM text (from the internal capabilities profile, not from site content)
  and the Aimplan page (written from the internal knowledge base, logo from aimplan.com).
- **Logo licences:** the home tool logos for Microsoft Fabric and Power BI come from Microsoft's
  Fabric icon set, licensed for diagrams and documentation; confirm a logo wall is acceptable.
  Terraform is the Simple Icons (CC0) mark.
- **Takeaways:** review `continuous-data-support` and `de-riziv-controleshoft-is-ingezet` first
  (thinnest posts).
- **GDPR:** the lead forms treat submitting as consent to marketing email; a separate unticked
  opt-in checkbox is safer.

## Keep the site consistent with the knowledge base

Acumen's internal knowledge base (Obsidian vault, `C:\Acumen\Acumen Knowledge Base`) is the source of
truth for positioning. As of Sep 2026: the Romania office is closed (no nearshore, fixed-price or
Romanian support claims), collecd's group size is not quoted, BOARD is no longer offered, and the
standard data engineering stack is dbt + Databricks/Fabric + Dagster. The site was brought in line
on 2026-09-29; check new copy against the vault. Never publish its internal material (financials,
client churn, pipeline, 1:1s).
