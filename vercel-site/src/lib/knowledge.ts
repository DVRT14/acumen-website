// Knowledge collection helpers: listings, related posts and the card data the carousels render.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'knowledge'>;
export type Author = CollectionEntry<'authors'>;
export type Card = { href: string; title: string; date: string; terms: string; excerpt?: string; image?: Record<string, string | number>; bg?: string };

export const TYPE_LABEL = { case: 'Customer case', blog: 'Blog', whitepaper: 'White paper' } as const;

export const href = (p: Post) => `/knowledge/${p.id}/`;
export const formatDate = (d: Date, lang = 'en-GB') => d.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Brussels' });

/** All posts, newest first; optionally one type. */
export async function posts(type?: Post['data']['type']) {
  const all = (await getCollection('knowledge')).sort((a, b) => +b.data.date - +a.data.date);
  return type ? all.filter(p => p.data.type === type) : all;
}

/** Most shared tags first (same type breaks ties), then newest. */
export async function related(post: Post, n = 6) {
  const tags = new Set(post.data.tags);
  const score = (p: Post) => p.data.tags.filter(t => tags.has(t)).length * 2 + (p.data.type === post.data.type ? 1 : 0);
  return (await posts()).filter(p => p.id !== post.id).map(p => [score(p), p] as const)
    .sort((a, b) => b[0] - a[0] || +b[1].data.date - +a[1].data.date).slice(0, n).map(([, p]) => p);
}

export function card(p: Post): Card {
  const { title, date, type, tags, excerpt, description, image, cardBg } = p.data;
  return {
    href: href(p), title, date: formatDate(date),
    terms: [TYPE_LABEL[type], ...tags.slice(0, 1)].join(', '),
    excerpt: excerpt ?? description,
    image: image && { ...image },
    bg: cardBg ?? '#C8EF00',
  };
}

/** ~220 words a minute. */
export const readingTime = (body = '') => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
