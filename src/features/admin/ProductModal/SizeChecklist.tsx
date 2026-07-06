import React from 'react';
import type { ProductVariant } from '@/types';
import { normalizeSize } from '@/lib/productVariants';
import {
  getSizeOptionsForRow,
  isSizeTakenByOtherGroup,
  isUniqueSize,
  isUniqueSizeOptionDisabled,
  UNIQUE_SIZE_LABEL,
} from './sizeMode';

interface SizeChecklistProps {
  currentSize: string;
  variants: ProductVariant[];
  onSelect: (size: string) => void;
}

export const SizeChecklist: React.FC<SizeChecklistProps> = ({
  currentSize,
  variants,
  onSelect,
}) => {
  const options = getSizeOptionsForRow(currentSize);
  const uniqueDisabled = isUniqueSizeOptionDisabled(variants);
  const selectedNorm = normalizeSize(currentSize);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((size) => {
        const isSelected =
          selectedNorm !== '' &&
          (normalizeSize(size) === selectedNorm ||
            (isUniqueSize(size) && isUniqueSize(currentSize)));
        const isUnique = isUniqueSize(size);
        const isDisabled =
          (isUnique && uniqueDisabled) ||
          isSizeTakenByOtherGroup(size, currentSize, variants);

        return (
          <button
            key={size}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(size)}
            className={`px-4 py-2.5 border text-xs font-black rounded-xl transition-all select-none uppercase tracking-wider
              ${isSelected
                ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/10'
                : isDisabled
                  ? 'bg-(--bg-main)/50 text-gray-400 border-(--border-main) cursor-not-allowed opacity-50'
                  : 'bg-(--bg-main) text-(--text-main) border-(--border-main) hover:border-primary/50'
              }`}
          >
            {size === UNIQUE_SIZE_LABEL ? 'Única' : size}
          </button>
        );
      })}
    </div>
  );
};
