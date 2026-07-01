import type { Color, ProductVariant } from '@/types';

/** @deprecated Solo pedidos legacy con texto "Único"/"Neutro" */
export const DEFAULT_COLOR = 'Neutro';

/** @deprecated Usar DEFAULT_COLOR */
export const UNIQUE_COLOR = DEFAULT_COLOR;

const LEGACY_DEFAULT_COLORS = new Set(['único', 'unico', 'neutro', '']);

/** Talla en mayúsculas para tienda, pedidos y persistencia (p. ej. "Xl" → "XL"). */
export function normalizeSize(size?: string | null): string {
  return size?.trim().toUpperCase() ?? '';
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

export function hasColorVariants(variants: ProductVariant[]): boolean {
  return variants.some(variantHasColor);
}

export function getVariantColorName(
  v: ProductVariant,
  catalog: Color[] = []
): string | null {
  if (v.color_id == null) return null;
  if (v.color?.trim()) return v.color.trim();
  return catalog.find((c) => c.id === v.color_id)?.name ?? null;
}

const variantKey = (size: string, colorId: number | null) =>
  `${size}::${colorId ?? 'null'}`;

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
      .filter((v) => v.size === size && v.color_id != null)
      .map((v) => v.color_id)
  );
  return catalog.filter((c) => !used.has(c.id));
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

export function findVariant(
  variants: ProductVariant[],
  size: string,
  options?: { colorId?: number | null; colorName?: string }
): ProductVariant | undefined {
  const sized = variants.filter((v) => v.size === size);
  if (options?.colorId != null) {
    return sized.find((v) => v.color_id === options.colorId);
  }
  if (options?.colorName) {
    const name = options.colorName.trim().toLowerCase();
    return sized.find((v) => v.color?.trim().toLowerCase() === name);
  }
  return sized.find((v) => v.color_id == null);
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
      out.push(...colored);
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
  return out;
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
