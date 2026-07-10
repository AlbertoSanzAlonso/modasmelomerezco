import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

function formatSizeLabel(size: string): string {
  return size === UNIQUE_SIZE_LABEL || isUniqueSize(size) ? 'Única' : size;
}

function isSizeSelected(size: string, currentSize: string): boolean {
  const selectedNorm = normalizeSize(currentSize);
  if (selectedNorm === '') return false;
  return (
    normalizeSize(size) === selectedNorm ||
    (isUniqueSize(size) && isUniqueSize(currentSize))
  );
}

export const SizeChecklist: React.FC<SizeChecklistProps> = ({
  currentSize,
  variants,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const options = getSizeOptionsForRow(currentSize);
  const uniqueDisabled = isUniqueSizeOptionDisabled(variants);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 220),
        zIndex: 200,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const summary = currentSize.trim()
    ? formatSizeLabel(currentSize)
    : 'Seleccionar talla…';

  const handleSelect = (size: string) => {
    onSelect(size);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-xs" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full flex items-center justify-between gap-3 bg-(--bg-main) border border-(--border-main) rounded-xl px-4 py-3 text-left text-xs font-black uppercase tracking-wider hover:border-primary/50 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={currentSize.trim() ? 'text-(--text-main)' : 'text-gray-400'}>
          {summary}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          style={menuStyle}
          className="bg-(--bg-main) border border-(--border-main) rounded-xl shadow-xl p-3"
          role="listbox"
        >
          <div className="flex flex-wrap gap-2">
            {options.map((size) => {
              const isSelected = isSizeSelected(size, currentSize);
              const isUnique = isUniqueSize(size);
              const isDisabled =
                (isUnique && uniqueDisabled) ||
                isSizeTakenByOtherGroup(size, currentSize, variants);

              return (
                <button
                  key={size}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isDisabled}
                  onClick={() => handleSelect(size)}
                  className={`px-3 py-2 border text-[11px] font-black rounded-xl transition-all select-none uppercase tracking-wider
                    ${isSelected
                      ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/10'
                      : isDisabled
                        ? 'bg-(--bg-main)/50 text-gray-400 border-(--border-main) cursor-not-allowed opacity-50'
                        : 'bg-(--bg-card) text-(--text-main) border-(--border-main) hover:border-primary/50'
                    }`}
                >
                  {formatSizeLabel(size)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
