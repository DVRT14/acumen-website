// Knowledge posts (src/content/knowledge/*.md) and their authors (src/data/authors.json).
// The other folders in src/content are page data read with import.meta.glob, not collections.
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const image = z.object({ src: z.string(), alt: z.string().default(''), width: z.number().optional(), height: z.number().optional(), srcset: z.string().optional() });

const knowledge = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/knowledge' }),
  schema: z.object({
    type: z.enum(['case', 'blog', 'whitepaper']),
    title: z.string(),
    subtitle: z.string().optional(),
    seoTitle: z.string().optional(),           // <title> when it differs from the headline
    description: z.string(),                   // meta description
    excerpt: z.string().optional(),            // card text (falls back to description)
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: reference('authors').default('acumen'),
    tags: z.array(z.string()).default([]),
    lang: z.string().optional(),               // e.g. nl-BE; default en-GB
    image: image.optional(),                   // card + hero image
    ogImage: z.string().optional(),            // share image (jpg: LinkedIn ignores webp)
    cardBg: z.string().optional(),
    noindex: z.boolean().optional(),
    custom: z.boolean().optional(),            // page is hand-built elsewhere; listed only
    // Customer cases
    client: z.string().optional(),
    clientLogo: image.optional(),
    industry: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    results: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    outcome: z.object({ decision: z.string(), result: z.string() }).optional(),  // card proof line: the client decision + what changed, in words (no numbers)
    quote: z.object({ text: z.string(), author: z.string().optional(), role: z.string().optional() }).optional(),
    // Lead form (whitepapers, some posts): hidden fields identify the submission in the forms webhook.
    form: z.object({
      name: z.string(), post_id: z.string(), form_id: z.string(), queried_id: z.string(), referer_title: z.string().optional(),
      title: z.string().optional(), text: z.string().optional(), submit: z.string().optional(),
      fields: z.array(z.object({ label: z.string(), name: z.string(), type: z.string().default('text') })).optional(),
    }).optional(),
    highlights: z.array(z.string()).optional(),  // whitepaper "what's inside"
    takeaways: z.array(z.string()).optional(),   // blog "key takeaways"
    cover: image.optional(),                     // whitepaper cover
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    cta: z.object({ title: z.string(), text: z.string().optional(), label: z.string().optional(), href: z.string().optional() }).optional(),
  }),
});

const authors = defineCollection({
  loader: file('./src/data/authors.json'),
  schema: z.object({
    name: z.string(),
    org: z.boolean().optional(),               // "Acumen" as author: rendered as the Organization
    role: z.string().optional(),
    bio: z.string().optional(),
    image: z.string().optional(),
    linkedin: z.string().url().optional(),
  }),
});

export const collections = { knowledge, authors };
