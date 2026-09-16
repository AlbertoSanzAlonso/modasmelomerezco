/**
 * CDN de imágenes: dominio custom de R2 (Cloudflare).
 * Evita `*.r2.dev` (rate-limited) y el proxy lento `/api/chat?k=`.
 */

const CANONICAL_ORIGIN = 'https://www.modasmelomerezco.es';
const IMAGE_CDN_ORIGIN = 'https://media.modasmelomerezco.es';

function extractR2Key(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : CANONICAL_ORIGIN;
    const u = new URL(trimmed, base);

    // Proxy temporal del sitio
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

    const host = u.hostname.toLowerCase();
    if (
      host === 'media.modasmelomerezco.es' ||
      host.endsWith('.r2.dev')
    ) {
      const key = decodeURIComponent(u.pathname.replace(/^\//, ''));
      return key || null;
    }
  } catch {
    // ignore
  }

  return null;
}

function cdnUrlForKey(key: string): string {
  return `${IMAGE_CDN_ORIGIN}/${key.replace(/^\/+/, '')}`;
}

/** Convierte una URL de producto a la CDN rápida de R2. */
export function toDisplayImageUrl(url?: string | null): string {
  if (!url?.trim()) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  const key = extractR2Key(trimmed);
  if (key) return cdnUrlForKey(key);

  return trimmed;
}

export function mapDisplayImageUrls(urls: (string | null | undefined)[]): string[] {
  return urls
    .map((u) => toDisplayImageUrl(u))
    .filter((u): u is string => !!u);
}

/** Normaliza URL para guardar en BD (CDN canónica, sin cache-bust `v`). */
export function toStoredImageUrl(url?: string | null): string {
  if (!url?.trim()) return '';
  const key = extractR2Key(url);
  if (key) return cdnUrlForKey(key);

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
