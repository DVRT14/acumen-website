import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.acumen.be',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: false,
});
