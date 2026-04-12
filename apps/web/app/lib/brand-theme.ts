/** Default matches `app.css` fallback for `--brand` / primary indigo. */
export const DEFAULT_BRAND_HEX = '#4F46E5';

export function hexToRgbChannels(hex: string): string {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6) return '79 70 229';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Shadcn format: `H S% L%` inside `hsl(var(--primary))`. */
export function hexToHslSpace(hex: string): string {
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hDeg = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hDeg = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hDeg = ((b - r) / d + 2) / 6;
        break;
      default:
        hDeg = ((r - g) / d + 4) / 6;
    }
  }
  const H = Math.round(hDeg * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

function relativeLuminance(hex: string): number {
  const h = hex.replace(/^#/, '');
  const rs = parseInt(h.slice(0, 2), 16) / 255;
  const gs = parseInt(h.slice(2, 4), 16) / 255;
  const bs = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const r = lin(rs);
  const g = lin(gs);
  const b = lin(bs);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function applyBrandTheme(brandColor: string | undefined): void {
  const root = document.documentElement;
  const effective =
    brandColor && /^#[0-9A-Fa-f]{6}$/.test(brandColor)
      ? brandColor
      : DEFAULT_BRAND_HEX;
  root.style.setProperty('--brand', hexToRgbChannels(effective));
  const hsl = hexToHslSpace(effective);
  root.style.setProperty('--primary', hsl);
  root.style.setProperty('--ring', hsl);
  root.style.setProperty('--accent-foreground', hsl);
  const lum = relativeLuminance(effective);
  root.style.setProperty(
    '--primary-foreground',
    lum > 0.55 ? '259 73% 15%' : '0 0% 100%',
  );
}

export function resetBrandTheme(): void {
  const root = document.documentElement;
  root.style.removeProperty('--brand');
  root.style.removeProperty('--primary');
  root.style.removeProperty('--ring');
  root.style.removeProperty('--accent-foreground');
  root.style.removeProperty('--primary-foreground');
}
