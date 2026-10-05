import { defineConfig } from 'astro/config';
import fs from 'node:fs';

// The live site's canonical host (www.acumen.be 301s here).
const site = 'https://acumen.be';

// sitemap.xml + robots.txt from the built pages: every page except the noindex ones, lastmod from
// the page's article:modified_time.
const sitemap = {
  name: 'sitemap',
  hooks: {
    'astro:build:done': ({ dir, pages }) => {
      const urls = pages.map(({ pathname }) => {
        const html = fs.readFileSync(new URL(`${pathname}index.html`, dir), 'utf8');
        if (/<meta name=['"]robots['"] content=['"]noindex/.test(html)) return '';
        const mod = html.match(/article:modified_time" content="([^"]+)"/)?.[1];
        return `<url><loc>${site}/${pathname}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>`;
      }).filter(Boolean).sort();
      fs.writeFileSync(new URL('sitemap.xml', dir), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
      fs.writeFileSync(new URL('robots.txt', dir), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
    },
  },
};

export default defineConfig({
  site,
  trailingSlash: 'always',
  // Inline the (small) page CSS: separate stylesheets cost a render-blocking round trip each.
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: false,
  integrations: [sitemap],
  // OUT_DIR lets a second build run while the visual harness is reading dist/.
  outDir: process.env.OUT_DIR || './dist',
});
