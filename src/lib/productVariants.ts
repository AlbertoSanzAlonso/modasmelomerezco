import type { Color, ProductVariant } from '@/types';

/** Color por defecto del catálogo (antes se guardaba como "Único"). */
export const DEFAULT_COLOR = 'Neutro';

/** @deprecated Usar DEFAULT_COLOR */
export const UNIQUE_COLOR = DEFAULT_COLOR;

const LEGACY_DEFAULT_COLORS = new Set(['único', 'unico', 'neutro', '']);

export function normalizeColor(color?: string | null): string {
  if (!color?.trim()) return DEFAULT_COLOR;
  if (LEGACY_DEFAULT_COLORS.has(color.trim().toLowerCase())) return DEFAULT_COLOR;
  return color.trim();
}

export function isDefaultColor(color?: string | null): boolean {
  return normalizeColor(color) === DEFAULT_COLOR;
}

const variantKey = (size: string, color: string) =>
  `${size}::${normalizeColor(color)}`;

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

  return order.map((size) => ({ size, items: map.get(size)! }));
}

export function getUnusedColorsForSize(
  variants: ProductVariant[],
  size: string,
  catalog: Color[]
): Color[] {
  const used = new Set(
    variants
      .filter((v) => v.size === size && v.color)
      .map((v) => normalizeColor(v.color).toLowerCase())
  );
  return catalog.filter((c) => !used.has(c.name.toLowerCase()));
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
  return sizes;
}

export function getColorNames(colors: Color[]): string[] {
  return colors.length > 0 ? colors.map((c) => c.name) : [DEFAULT_COLOR];
}

/** Combina tallas × colores conservando stock e ids de variantes existentes. */
export function syncVariants(
  existingVariants: ProductVariant[],
  sizes: string[],
  colors: Color[]
): ProductVariant[] {
  const validSizes = sizes.map((s) => s.trim()).filter(Boolean);
  if (validSizes.length === 0) return [];

  const colorNames = getColorNames(colors);
  const stockMap = new Map<string, number>();
  const metaMap = new Map<string, { id?: string; variant_id?: number }>();

  for (const v of existingVariants) {
    const key = variantKey(v.size, v.color);
    stockMap.set(key, v.stock ?? 0);
    metaMap.set(key, { id: v.id, variant_id: v.variant_id });
  }

  const onlyDefault = existingVariants.every((v) => isDefaultColor(v.color));
  if (onlyDefault && colors.length > 0) {
    for (const size of validSizes) {
      const legacyStock = stockMap.get(variantKey(size, DEFAULT_COLOR)) ?? 0;
      for (const color of colorNames) {
        const key = variantKey(size, color);
        if (!stockMap.has(key)) {
          stockMap.set(key, legacyStock);
        }
      }
    }
  }

  return validSizes.flatMap((size) =>
    colorNames.map((color) => {
      const key = variantKey(size, color);
      const meta = metaMap.get(key);
      return {
        id: meta?.id || `tmp-${size}-${color}`,
        variant_id: meta?.variant_id,
        size,
        color,
        stock: stockMap.get(key) ?? 0,
      };
    })
  );
}

export function findVariant(
  variants: ProductVariant[],
  size: string,
  color?: string
): ProductVariant | undefined {
  const normalizedColor = normalizeColor(color);
  return variants.find(
    (v) => v.size === size && normalizeColor(v.color) === normalizedColor
  );
}

export function hasStockForSize(variants: ProductVariant[], size: string): boolean {
  return variants.some((v) => v.size === size && (v.stock ?? 0) > 0);
}

export function hasStockForColor(
  variants: ProductVariant[],
  size: string,
  color: string
): boolean {
  const v = findVariant(variants, size, color);
  return (v?.stock ?? 0) > 0;
}

export function formatVariantLabel(size: string, color?: string): string {
  const c = normalizeColor(color);
  return isDefaultColor(c) ? `Talla ${size}` : `Talla ${size} · ${c}`;
}

export function formatOrderItemDetails(size?: string, color?: string): string {
  if (!size) return '';
  const c = normalizeColor(color);
  const colorPart = isDefaultColor(c) ? '' : ` • ${c}`;
  return `Talla: ${size}${colorPart}`;
}

export function getCartItemKey(
  productId: string,
  variant: { id: string; variant_id?: number; color?: string }
): string {
  return variant.variant_id
    ? `${productId}-v${variant.variant_id}`
    : `${productId}-${variant.id}-${normalizeColor(variant.color)}`;
}

/** Colores de catálogo web derivados de las líneas de inventario. */
export function deriveProductColors(
  variants: ProductVariant[],
  catalog: Color[]
): Color[] {
  const names = new Set<string>();
  for (const v of variants) {
    const c = v.color?.trim();
    if (c && !isDefaultColor(c)) names.add(normalizeColor(c));
  }
  return [...names]
    .map((name) => catalog.find((c) => c.name.toLowerCase() === name.toLowerCase()))
    .filter((c): c is Color => !!c);
}

export function normalizeVariantsForForm(
  variants: ProductVariant[],
  catalogColors: Color[]
): ProductVariant[] {
  if (variants.length > 0) {
    const normalized = variants.map((v) => ({
      ...v,
      id: (v.variant_id || v.id || `v-${Math.random()}`).toString(),
      color: normalizeColor(v.color),
      stock: v.stock ?? 0,
    }));
    return ensureNeutroLinePerSize(normalized);
  }
  return [{ id: 'v1', size: '', color: DEFAULT_COLOR, stock: 0 }];
}

/** Cada talla con stock debe tener al menos la línea Neutro. */
export function ensureNeutroLinePerSize(
  variants: ProductVariant[]
): ProductVariant[] {
  const groups = groupVariantsBySize(variants);
  const out: ProductVariant[] = [];

  for (const { size, items } of groups) {
    out.push(...items);
    if (size.trim() && !items.some((v) => isDefaultColor(v.color))) {
      out.push({
        id: `neutro-${size}-${Date.now()}`,
        size,
        color: DEFAULT_COLOR,
        stock: 0,
      });
    }
  }
  return out;
}

const NEUTRO_SWATCH = '#C4B8A8';

/** Asegura que "Neutro" exista en el listado del admin (catálogo o sintético). */
export function ensureNeutroInCatalog(catalog: Color[]): Color[] {
  const hasNeutro = catalog.some(
    (c) => c.name.toLowerCase() === DEFAULT_COLOR.toLowerCase()
  );
  if (hasNeutro) return catalog;
  return [{ id: 0, name: DEFAULT_COLOR, hex: NEUTRO_SWATCH }, ...catalog];
}
