import type { ProductVariant } from '@/types';
import { groupVariantsBySize, normalizeSize } from '@/lib/productVariants';

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

export function isUniqueSizeOptionDisabled(variants: ProductVariant[]): boolean {
  const sizes = groupVariantsBySize(variants)
    .map((g) => g.size.trim())
    .filter(Boolean);

  if (sizes.length > 1) return true;
  if (sizes.length === 1 && !isUniqueSize(sizes[0])) return true;
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
  const options: string[] = [...ADMIN_SIZE_OPTIONS];
  const trimmed = currentSize.trim();

  if (
    trimmed &&
    !options.some((o) => normalizeSize(o) === normalizeSize(trimmed)) &&
    !isUniqueSize(trimmed)
  ) {
    options.splice(options.length - 1, 0, trimmed);
  }

  return options;
}
