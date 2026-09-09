import type { Product } from '../types/index.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Detecta si el segmento de URL es un UUID de producto (URL antigua). */
export function isProductUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** Slug legible a partir del nombre (misma lógica que etiquetas / migración SQL). */
export function slugifyProductName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'producto';
}

/** Ruta canónica de ficha. Fallback a product_id si aún no hay slug. */
export function getProductPath(
  product: Pick<Product, 'product_id'> & { slug?: string | null },
): string {
  const slug = product.slug?.trim();
  return `/producto/${slug || product.product_id}`;
}

/** Segmento de path (slug o id) para construir URLs. */
export function getProductSlugOrId(
  product: Pick<Product, 'product_id'> & { slug?: string | null },
): string {
  const slug = product.slug?.trim();
  return slug || product.product_id;
}
