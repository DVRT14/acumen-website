// One-off migration (2026-09-29), kept for the record: run once, then the Markdown is the source.
// 1. Knowledge posts: src/content/knowledge/*.json (extracted Elementor fields) -> *.md with frontmatter
//    (see src/content.config.ts). The HTML is cleaned (stray/unbalanced spans, Word/ChatGPT paste
//    attributes, "<br>• " pseudo-lists) and converted to Markdown.
// 2. Every Yoast head blob (`seo` strings in src/data/meta.json and src/content/{pages,expertise,vacatures})
//    -> a small `seo` object that Base.astro renders.
// Needs turndown + turndown-plugin-gfm (not a site dependency):
//   npm i --prefix <dir> turndown turndown-plugin-gfm && NODE_PATH=<dir>/node_modules node tools/migrate_content.cjs
const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');

const src = path.join(__dirname, '../vercel-site/src');
const pub = path.join(__dirname, '../vercel-site/public');

const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
const decode = s => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(/^#x/i.test(e) ? parseInt(e.slice(2), 16) : +e.slice(1)) : named[e] ?? m);
const text = html => decode((html || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/[ \t\n]+/g, ' ').trim();

// ---- Yoast head -> seo object -------------------------------------------------------------------
function parseSeo(blob) {
  const m = re => blob.match(re)?.[1];
  const ld = JSON.parse(m(/<script type="application\/ld\+json" class="yoast-schema-graph">([\s\S]*?)<\/script>/) || '{"@graph":[]}')['@graph'];
  const article = ld.find(n => n['@type'] === 'Article') || {};
  const page = ld.find(n => n['@type'] === 'WebPage') || {};
  const robots = m(/name='robots' content='([^']*)'/) || '';
  const locale = m(/og:locale" content="([^"]*)"/);
  const seo = {
    title: decode(m(/<title>([\s\S]*?)<\/title>/) || ''),
    description: decode(m(/name="description" content="([^"]*)"/) || ''),
    image: m(/og:image" content="([^"]*)"/),
    published: m(/article:published_time" content="([^"]*)"/) || page.datePublished,
    modified: m(/article:modified_time" content="([^"]*)"/) || page.dateModified,
    noindex: /noindex/.test(robots) || undefined,
    lang: locale && locale !== 'en_GB' ? locale.replace('_', '-') : undefined,
  };
  for (const k of Object.keys(seo)) if (seo[k] === undefined || seo[k] === '') delete seo[k];
  return { seo, keywords: article.keywords || [], sections: article.articleSection || [], thumb: article.thumbnailUrl || page.thumbnailUrl, robots };
}

function convertSeo(file, get = o => [o]) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const o of get(data)) if (typeof o.seo === 'string') o.seo = parseSeo(o.seo).seo;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// ---- HTML -> Markdown ---------------------------------------------------------------------------
const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*', strongDelimiter: '**' });
td.use(gfm);
const BLOCK = /^<\/?(ul|ol|li|h\d|table|thead|tbody|tr|td|th|div|figure|img|blockquote|pre)\b/i;
const BULLET = /^((?:<(?:b|strong)>)*)\s*[•·▪]\s*/i;

function md(html) {
  if (!html) return '';
  let h = html
    .replace(/<\/?span[^>]*>/gi, '')                                     // stray + unbalanced spans
    .replace(/\s(?:data-[\w-]+|class|style|id|aria-[\w-]+|role|dir|lang)=("[^"]*"|'[^']*')/gi, '') // paste junk
    .replace(/<(b|strong)>\s*<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p>/gi, '\n\n');
  // Rebuild blocks line by line: "• x" lines (blank lines in between allowed) become one <ul>.
  const out = [];
  let list = null;
  for (let line of h.split('\n').map(l => l.replace(/ /g, ' ').trim())) {
    if (!line) continue;
    const b = line.match(BULLET);
    if (b) {
      if (!list) out.push(list = []);
      list.push(b[1] + line.slice(b[0].length));
      continue;
    }
    list = null;
    out.push(BLOCK.test(line) ? line : `<p>${line}</p>`);
  }
  const html2 = out.map(x => Array.isArray(x) ? `<ul>${x.map(li => `<li>${li}</li>`).join('')}</ul>` : x).join('\n');
  return td.turndown(html2).replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '').trim();
}

// ---- Frontmatter (small YAML writer: scalars as JSON, which is valid YAML) ------------------------
function yaml(obj, indent = '') {
  let s = '';
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || (Array.isArray(v) && !v.length)) continue;
    if (v instanceof Date) s += `${indent}${k}: ${v.toISOString()}\n`;
    else if (Array.isArray(v) && typeof v[0] === 'object') {
      s += `${indent}${k}:\n`;
      for (const item of v) s += yaml(item, indent + '    ').replace(/^ {4}/, `${indent}  - `);
    } else if (typeof v === 'object' && !Array.isArray(v)) s += `${indent}${k}:\n${yaml(v, indent + '  ')}`;
    else s += `${indent}${k}: ${JSON.stringify(v)}\n`;
  }
  return s;
}

// ---- Knowledge ----------------------------------------------------------------------------------
const cards = JSON.parse(fs.readFileSync(path.join(src, 'data/cards.json'), 'utf8'));
const cardByHref = Object.fromEntries(Object.values(cards).map(c => [c.href, c]));

const CASES = {
  'routing-optimization-essers-acumen': 'H.Essers',
  'bionerga-future-ready-data-platform': 'Bionerga',
  'kaneka-powerbi-sap-datasphere': 'Kaneka',
  'ai-legal-assistant-animo-law': 'Animo',
  'jump-start-your-data-lake-with-our-meta-data-driven-blueprint': null,
  'enhanced-sales-insights-leveraging-power-bi-reporting': 'Spaas Candles',
};
const AUTHORS = {
  'Karsten': 'karsten', 'Niels': 'niels-donders', 'Niels Donders': 'niels-donders', 'Josse Marchoul': 'josse-marchoul',
  'Joris': 'joris', 'Acumen': 'acumen', 'Wouter': 'wouter', 'Yves': 'yves', 'Arin': 'arin', 'Jannis Ramaekers': 'jannis-ramaekers',
  'Tjomme Vergauwen': 'tjomme-vergauwen', 'Hilde Houtmeyers': 'hilde-houtmeyers', 'Geert Wouters': 'geert-wouters',
};
// Categories that are the post type, not a topic.
const TYPE_CATS = /^(customer cases|white papers|blog)$/i;
const tagName = t => ({ ai: 'AI', reporting: 'Reporting', integration: 'Data integration', powerbi: 'Power BI' })[t.toLowerCase().replace(/\s/g, '')] || t;

function image(card, seoInfo) {
  if (card?.image) {
    const { loading, fetchpriority, decoding, sizes, ...img } = card.image;
    return { ...img, width: +img.width, height: +img.height };
  }
  const src = seoInfo.thumb || seoInfo.seo.image;
  return src ? { src, alt: '' } : undefined;
}

const kdir = path.join(src, 'content/knowledge');
const whitepaperFields = new Set();
const report = [];
for (const f of fs.readdirSync(kdir).filter(f => f.endsWith('.json'))) {
  const slug = f.replace(/\.json$/, '');
  const p = JSON.parse(fs.readFileSync(path.join(kdir, f), 'utf8'));
  const info = parseSeo(p.seo);
  const card = cardByHref[`/knowledge/${slug}/`];
  const type = p.template === 'whitepaper' ? 'whitepaper' : slug in CASES ? 'case' : 'blog';
  const tags = [...new Set([...info.sections.filter(s => !TYPE_CATS.test(s)), ...info.keywords].map(tagName).filter(t => !/^whitepaper-/i.test(t)))];

  let title, subtitle, body = [], extra = {};
  if (p.template === 'article') {
    const blocks = p.blocks;
    title = text(blocks.find(b => b.s === 'title').html);
    subtitle = text(blocks.find(b => b.s === 'subtitle')?.html) || undefined;
    for (const b of blocks) {
      if (b.s === 'title' || b.s === 'subtitle' || b.k === 'spacer') continue;
      if (b.k === 'heading') body.push(`## ${text(b.html)}`);
      else if (b.k === 'image') body.push(`![${b.img.alt || ''}](${b.img.src})`);
      else if (b.k === 'button') body.push(`[${text(b.label)}](${b.href})`);
      else if (b.k === 'form') { extra.form = { name: b.name, ...b.hidden }; body.push('<!-- lead form (frontmatter `form`) -->'); }
      else body.push(md(b.html));
    }
  } else {
    title = text(p.title);
    body.push(md(p.lead));
    if (type === 'whitepaper') {
      const { name, post_id, form_id, queried_id } = p.form;
      extra.form = { name, post_id, form_id, queried_id };
      whitepaperFields.add(JSON.stringify(p.fields));
    } else {
      for (const [t, x] of [[p.introTitle, p.introText], [p.featuresTitle, p.featuresText], [null, null], [p.conclusionTitle, p.conclusionText]]) {
        if (t === null && x === null) {                       // the quote sat between features and conclusion
          const q = text(p.quote).replace(/^[“"]|[”"]$/g, '');
          if (q) type === 'case' ? (extra.quote = { text: q }) : body.push(`> ${q}`);
          continue;
        }
        if (text(t)) body.push(`## ${text(t)}`);
        if (x) body.push(md(x));
      }
      const cta = { title: text(p.ctaTitle), text: text(p.ctaText) };
      if (cta.title) extra.cta = cta;
    }
  }
  if (p.appendix) {                                           // FAQ section + FAQPage JSON-LD -> frontmatter
    extra.faq = [...p.appendix.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map(([, q, a]) => ({ q: text(q), a: text(a) }));
  }

  const authorName = text(p.author).replace(/^AUTHOR\s*[–-]\s*/i, '');
  const author = AUTHORS[authorName] || 'acumen';
  if (authorName && !AUTHORS[authorName]) report.push(`unknown author "${authorName}" in ${slug}`);
  const ogImage = info.seo.image && fs.existsSync(path.join(pub, info.seo.image)) ? info.seo.image : undefined;
  const fm = {
    type,
    title,
    subtitle,
    seoTitle: info.seo.title !== title ? info.seo.title : undefined,
    description: info.seo.description,
    excerpt: card?.excerpt ? text(card.excerpt) : undefined,
    date: new Date(info.seo.published),
    updated: info.seo.modified && info.seo.modified !== info.seo.published ? new Date(info.seo.modified) : undefined,
    author,
    tags,
    lang: info.seo.lang,
    image: image(card, info),
    ogImage,
    cardBg: card?.bg && card.bg.toUpperCase() !== '#C8EF00' ? card.bg : undefined,
    noindex: info.seo.noindex,
    client: type === 'case' ? CASES[slug] || undefined : undefined,
    ...extra,
  };
  if (/nofollow/.test(info.robots)) report.push(`${slug}: dropped Yoast "nofollow"`);
  fs.writeFileSync(path.join(kdir, `${slug}.md`), `---\n${yaml(fm)}---\n\n${body.filter(Boolean).join('\n\n')}\n`);
  fs.unlinkSync(path.join(kdir, f));
  report.push(`${type.padEnd(10)} ${slug}  tags=${tags.join(', ')}`);
}
if (whitepaperFields.size > 1) report.push('WARNING: whitepaper forms differ: ' + [...whitepaperFields].join(' | '));

// The agentic AI page is hand-built (pages/knowledge/agentic-ai.astro); this entry lists it with the posts.
{
  const meta = JSON.parse(fs.readFileSync(path.join(src, 'data/meta.json'), 'utf8'));
  const info = parseSeo(meta['knowledge~agentic-ai'].seo);
  const card = cards['3891'];
  const fm = {
    type: 'blog', custom: true, title: text(card.title), seoTitle: info.seo.title, description: info.seo.description,
    date: new Date(info.seo.published), updated: new Date(info.seo.modified), author: 'acumen', tags: ['AI', 'Agentic AI'],
    image: image(card, info), ogImage: info.seo.image,
  };
  fs.writeFileSync(path.join(kdir, 'agentic-ai.md'), `---\n${yaml(fm)}---\n`);
}

// ---- Everything else: seo blob -> object ----------------------------------------------------------
convertSeo(path.join(src, 'data/meta.json'), o => Object.values(o));
for (const dir of ['pages', 'expertise', 'vacatures'])
  for (const f of fs.readdirSync(path.join(src, 'content', dir))) convertSeo(path.join(src, 'content', dir, f));

console.log(report.join('\n'));
