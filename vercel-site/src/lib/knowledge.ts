// Knowledge collection helpers: listings, related posts and the card data the carousels render.
import { getCollection, type CollectionEntry } from 'astro:content';
import authorList from '../data/authors.json';

export type Post = CollectionEntry<'knowledge'>;
export type Author = CollectionEntry<'authors'>;
// topic + date make the card label ("AI · 29 Jul 2026"); lang is set only for non-English posts.
// author: a named (non-org) author's name, never on cases; minutes: reading time (cases always, blogs with a named author,
// never gated white papers); pdf: a white paper download.
export type Card = { href: string; title: string; topic: string; date: string; datetime: string; lang?: string; terms: string; excerpt?: string; image?: Record<string, string | number>; bg?: string; author?: string; minutes?: number; pdf?: boolean };

export const TYPE_LABEL = { case: 'Customer case', blog: 'Blog', whitepaper: 'White paper' } as const;

/** Curated browse topics (the knowledge page filter): each maps the post tags it covers. */
export const TOPICS = {
  'AI': ['AI', 'Agentic AI'],
  'Data platform': ['Data platform', 'Data engineering', 'Data integration', 'Databricks', 'Microsoft Fabric', 'Dagster', 'Support'],
  'Power BI & reporting': ['Power BI', 'SAP'],
  'ESG & CSRD': ['ESG & CSRD'],
  'Strategy & governance': ['Data strategy', 'Data governance'],
} as const;
export type Topic = keyof typeof TOPICS;
/** The curated topics a post belongs to, in TOPICS order. */
export const topicsOf = (p: Post) => (Object.keys(TOPICS) as Topic[]).filter(t => TOPICS[t].some(tag => p.data.tags.includes(tag)));

export const href = (p: Post) => `/knowledge/${p.id}/`;
export const formatDate = (d: Date, lang = 'en-GB') => d.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Brussels' });
/** Card label date: "29 Jul 2026", or "Jul 2025" without the day. */
const shortDate = (d: Date, day = true) => d.toLocaleDateString('en-GB', { ...(day && { day: 'numeric' }), month: 'short', year: 'numeric', timeZone: 'Europe/Brussels' }).replace('Sept', 'Sep');

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
  const { title, date, type, tags, excerpt, description, image, cardBg, client, lang } = p.data;
  const isCase = type === 'case', isPdf = type === 'whitepaper';
  // Sync lookup (card() is used in .map): the author reference is resolved against the JSON the collection loads.
  const person = authorList.find(a => a.id === p.data.author.id && !('org' in a && a.org));
  return {
    href: href(p), title,
    // Cases lead with the client and the month; the rest with their main topic and the day.
    topic: (isCase && client) || tags[0] || TYPE_LABEL[type], date: shortDate(date, !isCase), datetime: date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Brussels' }),
    lang: lang && !lang.startsWith('en') ? lang : undefined,
    terms: [TYPE_LABEL[type], ...tags.slice(0, 1)].join(', '),
    excerpt: excerpt ?? description,
    image: image && { ...image },
    bg: cardBg ?? '#C8EF00',
    ...(isCase ? { minutes: readingTime(p.body) } : person && { author: person.name, minutes: isPdf ? undefined : readingTime(p.body) }),
    pdf: isPdf || undefined,
  };
}

/** ~220 words a minute. */
export const readingTime = (body = '') => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
