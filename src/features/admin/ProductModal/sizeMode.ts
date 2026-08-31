import type { ProductVariant } from '@/types';
import {
  groupVariantsBySize,
  isUniqueSize,
  normalizeSize,
  sortSizes,
  UNIQUE_SIZE_LABEL,
} from '@/lib/productVariants';

export { isUniqueSize, UNIQUE_SIZE_LABEL };

export const ADMIN_SIZE_OPTIONS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  UNIQUE_SIZE_LABEL,
] as const;

/** Tallas EU habituales para calzado de mujer. */
export const ADMIN_FOOTWEAR_SIZE_OPTIONS = [
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  UNIQUE_SIZE_LABEL,
] as const;

export type AdminSizeMode = 'clothing' | 'footwear';

export function isFootwearCategory(categoryName?: string | null): boolean {
  return (categoryName ?? '').trim().toLowerCase() === 'calzado';
}

export function getAdminSizeOptions(mode: AdminSizeMode = 'clothing'): string[] {
  return mode === 'footwear'
    ? [...ADMIN_FOOTWEAR_SIZE_OPTIONS]
    : [...ADMIN_SIZE_OPTIONS];
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

export function getSizeOptionsForRow(
  currentSize: string,
  mode: AdminSizeMode = 'clothing'
): string[] {
  const trimmed = currentSize.trim();
  const options = new Set<string>(getAdminSizeOptions(mode));

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
