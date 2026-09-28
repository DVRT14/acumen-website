import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.acumen.be',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: false,
  // OUT_DIR lets a second build run while the visual harness is reading dist/.
  outDir: process.env.OUT_DIR || './dist',
});
