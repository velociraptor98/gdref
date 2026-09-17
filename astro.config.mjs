// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * The canonical origin. Used for <link rel="canonical">, Open Graph URLs and
 * the sitemap — so it must be the real deployed origin, with no trailing slash.
 *
 * Set SITE_URL in the host's build environment. The fallback is a placeholder
 * and is only correct if you actually own that domain.
 */
const SITE = process.env.SITE_URL ?? 'https://gdref.dev';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // Legacy stubs are deliberately thin redirect pages — indexing them
      // competes with the concepts they point at.
      filter: (page) => !page.includes('/legacy/'),
    }),
  ],
  markdown: {
    // `css-variables` makes Shiki emit var(--astro-code-*) instead of baked
    // hex, so highlighting follows the Carbonfox syntax roles defined in
    // global.css rather than approximating them with a stock theme.
    shikiConfig: { theme: 'css-variables', wrap: true },
  },
});
