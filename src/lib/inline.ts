/**
 * Render the small subset of Markdown we allow in frontmatter strings
 * (`notes`, `migration`, `gap`). Those fields are plain YAML scalars, not
 * Markdown bodies, so Astro does not process them — but authors reasonably
 * write `like_this` when naming a symbol.
 *
 * Escapes first, then unescapes only the tags we generate, so content stays
 * safe regardless of what lands in the frontmatter.
 */
export function inlineMd(src: string | undefined): string {
  if (!src) return '';
  const escaped = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, '<em>$1</em>');
}
