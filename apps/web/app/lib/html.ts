/** Plain text for previews and search when content may be HTML from TipTap. */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent ?? '').replace(/\s+/g, ' ').trim();
}
