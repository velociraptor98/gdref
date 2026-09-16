// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gdref.dev',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed', wrap: true },
  },
});
