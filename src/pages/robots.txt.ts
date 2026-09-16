import type { APIRoute } from 'astro';

/**
 * Generated rather than static so the sitemap URL always matches the configured
 * `site` — a hardcoded origin here silently rots when the domain changes.
 */
export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Thin redirect stubs; the concepts they point at are the real content.',
    'Disallow: /legacy/',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
