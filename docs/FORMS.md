# Forms

Every form is a `<form data-form>` that `src/scripts/widgets.js` POSTs (FormData) to `/api/forms`
(`vercel-site/api/forms.js`), which forwards it to the `FORMS_WEBHOOK_URL` webhook (see README →
Forms). The hidden fields `post_id`, `form_id`, `referer_title`, `queried_id` are kept from the old
Elementor forms so submissions stay identifiable; the webhook payload carries `form_id` and
`page` (= `referer_title`). A form can set its own success text with `data-success`.

Forms in the build (2026-09-29):

| Page | Form name | `form_id` | Component / source |
|---|---|---|---|
| `/contact/` | New Form | `748be11` | `src/pages/contact.astro` |
| `/careers/vacature-ai-engineer/` | Subscribe Form | `83bd617` | `src/pages/careers/[slug].astro` (with CV upload) |
| `/careers/vacature-analytics-engineer/` | Subscribe Form | `83bd617` | same |
| `/knowledge/power-bi-whitepaper/` | Whitepaper Power BI | `317928dc` | `LeadForm` ← frontmatter `form` |
| `/knowledge/data-warehouse-to-lakehouse-whitepaper/` | Whitepaper Data Engineering | `73105cb4` | same |
| `/knowledge/modern-data-platform-whitepaper/` | Whitepaper Data Engineering | `8e22492` | same |
| `/knowledge/our-ai-and-ml-services-more-info/` | Whitepaper AI | `ad92be4` | same |
| `/knowledge/animo-ai-powered-legal-assistant/` | Whitepaper AI | `ad92be4` | same |
| `/knowledge/embracing-esg-csrd/` | Whitepaper ESG | `1442a231` | same |
| `/knowledge/de-riziv-controleshoft-is-ingezet/` | New Form (RIZIV whitepaper, NL) | `8f1d034` | same |
| `/white-paper-download-page/` | New Form | `442063c8` | `components/post/WhitepaperDownload.astro` |

Whitepaper and gated-post forms are defined in the post's frontmatter (`form`, see
`docs/CONTENT.md`) and rendered by `src/components/knowledge/LeadForm.astro`.

**Removed:** the newsletter sign-up (`Subscribe Form`, `e914a34`) that ended every old blog/case
post — Acumen no longer sends a newsletter (2026-09-29). Webhook flows that handled `e914a34` can go.

Check the endpoint end to end: `node tools/forms-check.mjs`.
