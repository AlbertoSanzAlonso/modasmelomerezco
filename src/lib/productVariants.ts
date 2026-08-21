import type { Color, ProductVariant } from '@/types';

/** @deprecated Solo pedidos legacy con texto "Único"/"Neutro" */
export const DEFAULT_COLOR = 'Neutro';

/** @deprecated Usar DEFAULT_COLOR */
export const UNIQUE_COLOR = DEFAULT_COLOR;

const LEGACY_DEFAULT_COLORS = new Set(['único', 'unico', 'neutro', '']);

export const UNIQUE_SIZE_LABEL = 'Única';

const UNIQUE_SIZE_VALUES = new Set([
  'única',
  'unica',
  'talla única',
  'talla unica',
  'u',
  'tu',
  'one size',
  'os',
]);

/** Talla en mayúsculas para tienda, pedidos y persistencia (p. ej. "Xl" → "XL"). */
export function normalizeSize(size?: string | null): string {
  return size?.trim().toUpperCase() ?? '';
}

export function isUniqueSize(size?: string | null): boolean {
  if (!size?.trim()) return false;
  const norm = size.trim().toLowerCase();
  return UNIQUE_SIZE_VALUES.has(norm) || norm === UNIQUE_SIZE_LABEL.toLowerCase();
}

/** Orden estándar de tallas de letra (de menor a mayor). */
const LETTER_SIZE_ORDER = [
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '2XL',
  'XXXL',
  '3XL',
  '4XL',
  '5XL',
  'TU',
  'U',
  'UNICA',
  'ÚNICA',
  'ONE SIZE',
  'OS',
] as const;

const ONE_SIZE_LABELS = new Set([
  'única',
  'unica',
  'talla única',
  'talla unica',
  'u',
  'tu',
  'one size',
  'os',
]);

/** Talla única (sin selector de letra/número en tienda). */
export function isOneSize(size?: string | null): boolean {
  if (!size?.trim()) return false;
  const lower = size.trim().toLowerCase();
  if (ONE_SIZE_LABELS.has(lower)) return true;
  const norm = normalizeSize(size);
  return norm === 'UNICA' || norm === 'ÚNICA' || norm === 'ONE SIZE' || norm === 'OS' || norm === 'TU' || norm === 'U';
}

export function isOneSizeOnlyProduct(variants: ProductVariant[]): boolean {
  const sizes = getUniqueSizes(variants);
  return sizes.length === 1 && isOneSize(sizes[0]);
}

export function getOneSizeForProduct(variants: ProductVariant[]): string | null {
  if (!isOneSizeOnlyProduct(variants)) return null;
  return getUniqueSizes(variants)[0] ?? null;
}

/** Compara dos tallas: letra (S→XL), numéricas (36→40) y resto alfabético. */
export function compareSizes(a: string, b: string): number {
  const normA = normalizeSize(a);
  const normB = normalizeSize(b);

  const rankA = LETTER_SIZE_ORDER.indexOf(normA as (typeof LETTER_SIZE_ORDER)[number]);
  const rankB = LETTER_SIZE_ORDER.indexOf(normB as (typeof LETTER_SIZE_ORDER)[number]);
  const letterA = rankA !== -1;
  const letterB = rankB !== -1;

  if (letterA && letterB) return rankA - rankB;
  if (letterA) return -1;
  if (letterB) return 1;

  const numericPattern = /^\d+(?:[.,]\d+)?$/;
  const numA = numericPattern.test(normA);
  const numB = numericPattern.test(normB);

  if (numA && numB) {
    return (
      parseFloat(normA.replace(',', '.')) - parseFloat(normB.replace(',', '.'))
    );
  }
  if (numA) return -1;
  if (numB) return 1;

  return normA.localeCompare(normB, 'es');
}

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort(compareSizes);
}

/** Normaliza texto de color en pedidos o datos antiguos. */
export function normalizeColor(color?: string | null): string {
  if (!color?.trim()) return DEFAULT_COLOR;
  if (LEGACY_DEFAULT_COLORS.has(color.trim().toLowerCase())) return DEFAULT_COLOR;
  return color.trim();
}

/** @deprecated Usar variantHasColor / hasColorVariants */
export function isDefaultColor(color?: string | null): boolean {
  return normalizeColor(color) === DEFAULT_COLOR;
}

export function variantHasColor(v: ProductVariant): boolean {
  return v.color_id != null;
}

export function countColorVariants(variants: ProductVariant[]): number {
  return variants.filter(variantHasColor).length;
}

export function hasColorVariants(variants: ProductVariant[]): boolean {
  return variants.some(variantHasColor);
}

export function getVariantColorName(
  v: ProductVariant,
  catalog: Color[] = [],
  productName?: string | null
): string | null {
  if (v.color_id == null) return null;
  if (v.color?.trim()) {
    return getColorDisplayName(v.color.trim(), productName);
  }
  const fromCatalog = catalog.find((c) => c.id === v.color_id)?.name;
  return fromCatalog ? getColorDisplayName(fromCatalog, productName) : null;
}

const variantKey = (size: string, colorId: number | null) =>
  `${size}::${colorId ?? 'null'}`;

export function variantSizeColorKey(
  size: string,
  colorId?: number | null
): string {
  return variantKey(normalizeSize(size), colorId ?? null);
}

/** Una sola fila por talla + color_id (la última del array gana). */
export function dedupeVariantsBySizeAndColor(
  variants: ProductVariant[]
): ProductVariant[] {
  const map = new Map<string, ProductVariant>();
  for (const v of variants) {
    const size = normalizeSize(v.size);
    if (!size) continue;
    const colorId = v.color_id ?? null;
    map.set(variantSizeColorKey(size, colorId), {
      ...v,
      size,
      color_id: colorId,
    });
  }
  return Array.from(map.values()).sort((a, b) => compareSizes(a.size, b.size));
}

export interface SizeVariantGroup {
  size: string;
  items: ProductVariant[];
}

export function groupVariantsBySize(variants: ProductVariant[]): SizeVariantGroup[] {
  const order: string[] = [];
  const map = new Map<string, ProductVariant[]>();

  for (const v of variants) {
    const size = v.size ?? '';
    if (!map.has(size)) {
      map.set(size, []);
      order.push(size);
    }
    map.get(size)!.push(v);
  }

  return sortSizes(order).map((size) => ({ size, items: map.get(size)! }));
}

export function getBaseVariantForSize(
  variants: ProductVariant[],
  size: string
): ProductVariant | undefined {
  return variants.find((v) => v.size === size && v.color_id == null);
}

export function getColoredVariantsForSize(
  variants: ProductVariant[],
  size: string
): ProductVariant[] {
  return variants.filter((v) => v.size === size && v.color_id != null);
}

export function getUnusedColorsForSize(
  variants: ProductVariant[],
  size: string,
  catalog: Color[]
): Color[] {
  const used = new Set(
    variants
      .filter((v) => v.size === size && asColorId(v.color_id) != null)
      .map((v) => asColorId(v.color_id) as number)
  );
  return catalog.filter((c) => !used.has(Number(c.id)));
}

export function getUniqueSizes(variants: ProductVariant[]): string[] {
  const seen = new Set<string>();
  const sizes: string[] = [];
  for (const v of variants) {
    const size = v.size?.trim();
    if (size && !seen.has(size)) {
      seen.add(size);
      sizes.push(size);
    }
  }
  return sortSizes(sizes);
}

function asColorId(colorId: unknown): number | null {
  if (colorId == null || colorId === '') return null;
  const parsed = Number(colorId);
  return Number.isInteger(parsed) ? parsed : null;
}

export function findVariant(
  variants: ProductVariant[],
  size: string,
  options?: { colorId?: number | null; colorName?: string }
): ProductVariant | undefined {
  const sizeNorm = normalizeSize(size);
  const sized = variants.filter((v) => normalizeSize(v.size) === sizeNorm);
  if (options?.colorId != null) {
    const want = asColorId(options.colorId);
    return sized.find((v) => asColorId(v.color_id) === want);
  }
  if (options?.colorName) {
    const name = options.colorName.trim().toLowerCase();
    return sized.find((v) => v.color?.trim().toLowerCase() === name);
  }
  return sized.find((v) => asColorId(v.color_id) == null);
}

export function hasStockForSize(variants: ProductVariant[], size: string): boolean {
  return variants.some((v) => v.size === size && (v.stock ?? 0) > 0);
}

export function hasStockForColor(
  variants: ProductVariant[],
  size: string,
  colorId: number
): boolean {
  const v = findVariant(variants, size, { colorId });
  return (v?.stock ?? 0) > 0;
}

/** Unidades totales del producto (variantes o campo stock). */
export function getProductTotalStock(product: {
  variants?: ProductVariant[] | null;
  stock?: number | null;
}): number {
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  }
  return product.stock ?? 0;
}

export function isProductSoldOut(product: {
  is_sold_out?: boolean | null;
  variants?: ProductVariant[] | null;
  stock?: number | null;
}): boolean {
  return product.is_sold_out === true;
}

export function formatVariantLabel(
  size: string,
  color?: string | null
): string {
  const sizeLabel = normalizeSize(size);
  return color?.trim() ? `Talla ${sizeLabel} · ${color}` : `Talla ${sizeLabel}`;
}

/** Color visible en pedidos/factura (null = mostrar "-"). */
export function formatOrderItemColorLabel(color?: string | null): string | null {
  if (!color?.trim() || color === 'Único') return null;
  const c = color.trim();
  if (LEGACY_DEFAULT_COLORS.has(c.toLowerCase())) return null;
  return c;
}

export function formatOrderItemDetails(size?: string, color?: string | null): string {
  const sizeLabel = normalizeSize(size);
  if (!sizeLabel) return '';
  const colorLabel = formatOrderItemColorLabel(color);
  const colorPart = colorLabel ? ` • ${colorLabel}` : '';
  return `Talla: ${sizeLabel}${colorPart}`;
}

export function getCartItemKey(
  productId: string,
  variant: { id: string; variant_id?: number; color_id?: number | null }
): string {
  return variant.variant_id
    ? `${productId}-v${variant.variant_id}`
    : `${productId}-${variant.id}-${variant.color_id ?? 'n'}`;
}

/** URL de ficha con talla y color preseleccionados (p. ej. desde el carrito). */
export function getProductUrlWithVariant(
  productId: string,
  variant: Pick<ProductVariant, 'size' | 'color_id'>,
): string {
  const params = new URLSearchParams();
  if (variant.size) params.set('talla', variant.size);
  if (variant.color_id != null) params.set('color', String(variant.color_id));
  const qs = params.toString();
  return `/producto/${productId}${qs ? `?${qs}` : ''}`;
}

/** Slug estable para ligar nombres de color al artículo (p. ej. amarillo_vestido-lino). */
export function slugifyProductKey(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'producto'
  );
}

/**
 * Nombre único en BD: "Amarillo_nombre-producto".
 * Si ya existe, "Amarillo_2_nombre-producto", etc.
 */
export function buildScopedColorName(
  label: string,
  productName: string,
  existingNames: string[] = []
): string {
  const base = label.trim();
  const slug = slugifyProductKey(productName);
  const existing = new Set(existingNames.map((n) => n.toLowerCase()));
  let candidate = `${base}_${slug}`;
  let n = 2;
  while (existing.has(candidate.toLowerCase())) {
    candidate = `${base}_${n}_${slug}`;
    n += 1;
  }
  return candidate;
}

/** Etiqueta visible: quita el sufijo _nombre-producto del nombre guardado. */
export function getColorDisplayName(
  storedName: string,
  productName?: string | null
): string {
  if (!storedName?.trim()) return storedName;
  if (!productName?.trim()) return storedName;
  const slug = slugifyProductKey(productName);
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`_(?:\\d+_)?${escaped}$`, 'i');
  const display = storedName.replace(re, '').trim();
  return display || storedName;
}

/** true si el color es propio del artículo (no genérico del catálogo). */
export function isOwnedProductColor(
  color: Pick<Color, 'product_id'>,
  productId?: string | null
): boolean {
  if (!productId) return Boolean(color.product_id);
  return color.product_id === productId;
}

/** Colores de catálogo web derivados de variantes con color_id. */
export function deriveProductColors(
  variants: ProductVariant[],
  catalog: Color[]
): Color[] {
  const ids = new Set(
    variants
      .map((v) => v.color_id)
      .filter((id): id is number => id != null)
  );
  return [...ids]
    .map((id) => catalog.find((c) => c.id === id))
    .filter((c): c is Color => !!c);
}

/** Alinea `image_color_ids` con la longitud de `images`. */
export function alignImageColorIds(
  imageCount: number,
  colorIds?: (number | null)[] | null
): (number | null)[] {
  const ids = colorIds ? [...colorIds] : [];
  while (ids.length < imageCount) ids.push(null);
  return ids.slice(0, imageCount).map((id) => {
    if (id == null) return null;
    const n = Number(id);
    return Number.isInteger(n) ? n : null;
  });
}

/** Índice de la primera foto asociada a un color, o -1 si no hay. */
export function findImageIndexForColor(
  imageColorIds: (number | null)[] | undefined | null,
  colorId: number
): number {
  if (!imageColorIds?.length || !Number.isInteger(colorId)) return -1;
  return imageColorIds.findIndex((id) => id === colorId);
}

/** Al guardar: si una talla tiene colores, quitar filas sin color_id de esa talla. */
export function consolidateVariantsForSave(
  variants: ProductVariant[]
): ProductVariant[] {
  const normalized = variants.map((v) => ({
    ...v,
    size: normalizeSize(v.size),
  }));
  const bySize = groupVariantsBySize(normalized);
  const out: ProductVariant[] = [];

  for (const { size, items } of bySize) {
    const colored = items.filter((v) => v.color_id != null);
    const base = items.filter((v) => v.color_id == null);
    if (colored.length > 0) {
      const byColor = new Map<number, ProductVariant>();
      for (const v of colored) {
        if (v.color_id != null) byColor.set(v.color_id, v);
      }
      out.push(...byColor.values());
    } else {
      const single = base[0] ?? {
        id: `base-${size}`,
        size,
        color_id: null,
        stock: 0,
      };
      out.push({ ...single, color_id: null, color: undefined });
    }
  }
  return dedupeVariantsBySizeAndColor(out);
}

export function normalizeVariantsForForm(
  variants: ProductVariant[],
  catalogColors: Color[]
): ProductVariant[] {
  if (variants.length === 0) {
    return [{ id: 'v1', size: '', color_id: null, stock: 0 }];
  }

  const normalized = variants.map((v) => {
    let colorId = v.color_id ?? null;
    if (colorId == null && v.color) {
      const legacy = normalizeColor(v.color);
      if (!isDefaultColor(legacy)) {
        const match = catalogColors.find(
          (c) => c.name.toLowerCase() === legacy.toLowerCase()
        );
        colorId = match?.id ?? null;
      }
    }
    const colorName =
      colorId != null
        ? catalogColors.find((c) => c.id === colorId)?.name ?? v.color ?? null
        : null;

    return {
      ...v,
      id: (v.variant_id || v.id || `v-${Math.random()}`).toString(),
      color_id: colorId,
      color: colorName ?? undefined,
      stock: v.stock ?? 0,
    };
  });

  return ensureBaseRowPerSize(consolidateVariantsForSave(normalized));
}

/** Cada talla debe tener al menos una fila (solo talla o con colores). */
export function ensureBaseRowPerSize(variants: ProductVariant[]): ProductVariant[] {
  const groups = groupVariantsBySize(variants);
  const out: ProductVariant[] = [];

  for (const { size, items } of groups) {
    const colored = items.filter((v) => v.color_id != null);
    if (colored.length > 0) {
      out.push(...colored);
    } else if (size.trim()) {
      const base = items.find((v) => v.color_id == null);
      out.push(
        base ?? {
          id: `base-${size}-${Date.now()}`,
          size,
          color_id: null,
          stock: 0,
        }
      );
    } else {
      out.push(...items);
    }
  }
  return out;
}

/** @deprecated Ya no se usa Neutro sintético en inventario */
export function ensureNeutroInCatalog(catalog: Color[]): Color[] {
  return catalog.filter(
    (c) => c.name.toLowerCase() !== DEFAULT_COLOR.toLowerCase()
  );
}
