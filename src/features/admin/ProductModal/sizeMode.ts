import type { ProductVariant } from '@/types';
import { groupVariantsBySize, normalizeSize, sortSizes } from '@/lib/productVariants';

export const UNIQUE_SIZE_LABEL = 'Única';

export const ADMIN_SIZE_OPTIONS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  UNIQUE_SIZE_LABEL,
] as const;

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

export function isUniqueSize(size?: string | null): boolean {
  if (!size?.trim()) return false;
  const norm = size.trim().toLowerCase();
  return UNIQUE_SIZE_VALUES.has(norm) || norm === UNIQUE_SIZE_LABEL.toLowerCase();
}

export function canAddMoreSizes(variants: ProductVariant[]): boolean {
  return !variants.some((v) => isUniqueSize(v.size));
}

/** Única siempre se puede elegir; solo se bloquea añadir más tallas (canAddMoreSizes). */
export function isUniqueSizeOptionDisabled(_variants: ProductVariant[]): boolean {
  return false;
}

export function isSizeTakenByOtherGroup(
  size: string,
  currentSize: string,
  variants: ProductVariant[]
): boolean {
  return groupVariantsBySize(variants).some(
    (g) =>
      g.size.trim() &&
      normalizeSize(g.size) === normalizeSize(size) &&
      normalizeSize(g.size) !== normalizeSize(currentSize)
  );
}

export function getSizeOptionsForRow(currentSize: string): string[] {
  const trimmed = currentSize.trim();
  const options = new Set<string>([...ADMIN_SIZE_OPTIONS]);

  if (
    trimmed &&
    ![...options].some((o) => normalizeSize(o) === normalizeSize(trimmed)) &&
    !isUniqueSize(trimmed)
  ) {
    options.add(trimmed);
  }

  const regular = [...options].filter((s) => !isUniqueSize(s));
  const unique = [...options].filter((s) => isUniqueSize(s));

  return [...sortSizes(regular), ...sortSizes(unique)];
}
