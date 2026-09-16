/**
 * Las URLs públicas `*.r2.dev` dejan de responder (timeout).
 * Servimos las imágenes por proxy: `/api/chat?k=<object-key>`.
 */

const CANONICAL_ORIGIN = 'https://www.modasmelomerezco.es';

function extractR2Key(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : CANONICAL_ORIGIN;
    const u = new URL(trimmed, base);
    if (u.pathname === '/api/chat' || u.pathname.endsWith('/api/chat')) {
      const k = u.searchParams.get('k')?.trim();
      if (k) {
        try {
          return decodeURIComponent(k).replace(/^\/+/, '');
        } catch {
          return k.replace(/^\/+/, '');
        }
      }
    }
    if (u.hostname.toLowerCase().endsWith('.r2.dev')) {
      const key = decodeURIComponent(u.pathname.replace(/^\//, ''));
      return key || null;
    }
  } catch {
    // ignore
  }

  return null;
}

/** Convierte una URL de producto (r2.dev o proxy) a URL servible en el sitio. */
export function toDisplayImageUrl(url?: string | null): string {
  if (!url?.trim()) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  const key = extractR2Key(trimmed);
  if (key) {
    return `/api/chat?k=${encodeURIComponent(key)}`;
  }

  return trimmed;
}

export function mapDisplayImageUrls(urls: (string | null | undefined)[]): string[] {
  return urls
    .map((u) => toDisplayImageUrl(u))
    .filter((u): u is string => !!u);
}

/** Normaliza URL para guardar en BD (proxy canónico, sin cache-bust `v`). */
export function toStoredImageUrl(url?: string | null): string {
  if (!url?.trim()) return '';
  const key = extractR2Key(url);
  if (key) {
    return `${CANONICAL_ORIGIN}/api/chat?k=${encodeURIComponent(key)}`;
  }

  const trimmed = url.trim();
  try {
    const u = new URL(trimmed, CANONICAL_ORIGIN);
    u.searchParams.delete('v');
    const q = u.searchParams.toString();
    return q ? `${u.origin}${u.pathname}?${q}` : `${u.origin}${u.pathname}`;
  } catch {
    return trimmed.split('?')[0];
  }
}
