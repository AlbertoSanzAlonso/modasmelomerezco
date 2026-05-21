import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Tag } from 'lucide-react';
import type { DiscountCode } from '@/types';

interface ProductDiscountCodesProps {
  selectedCodes: DiscountCode[];
  availableCodes: DiscountCode[];
  onCodesChange: (codes: DiscountCode[]) => void;
}

function formatDiscountLabel(dc: DiscountCode): string {
  const value =
    dc.discount_type === 'percent'
      ? `${dc.discount_value}%`
      : `${dc.discount_value.toFixed(2)}€`;
  return `${dc.code} (${value})`;
}

export const ProductDiscountCodes: React.FC<ProductDiscountCodesProps> = ({
  selectedCodes = [],
  availableCodes = [],
  onCodesChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCode = (code: DiscountCode) => {
    const isSelected = selectedCodes.some((c) => c.id === code.id);
    if (isSelected) {
      onCodesChange(selectedCodes.filter((c) => c.id !== code.id));
    } else {
      onCodesChange([...selectedCodes, code]);
    }
  };

  const activeCodes = availableCodes.filter((c) => c.is_active);
  const inactiveSelected = selectedCodes.filter(
    (c) => !availableCodes.find((a) => a.id === c.id && a.is_active)
  );
  const options = [
    ...activeCodes,
    ...inactiveSelected.filter((c) => !activeCodes.some((a) => a.id === c.id)),
  ];

  const summary =
    selectedCodes.length === 0
      ? 'Seleccionar códigos de descuento…'
      : selectedCodes.map((c) => c.code).join(', ');

  return (
    <div className="space-y-8 border-t border-(--border-main) pt-12" ref={containerRef}>
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block">
          Códigos de descuento
        </label>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
          Los códigos asignados aquí o a la subcategoría del producto (en Admin → Descuentos)
          podrán aplicarse en el carrito.
        </p>
      </div>

      {availableCodes.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          No hay códigos creados. Créalos en Admin → Descuentos.
        </p>
      ) : (
        <div className="relative max-w-xl">
          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 bg-(--bg-card) border border-(--border-main) rounded-xl px-4 py-3 text-left text-xs font-bold hover:border-primary/50 transition-colors"
          >
            <span className="flex items-center gap-2 truncate text-(--text-main)">
              <Tag className="w-4 h-4 shrink-0 text-primary" />
              <span className={selectedCodes.length === 0 ? 'text-gray-400' : ''}>{summary}</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto bg-(--bg-main) border border-(--border-main) rounded-xl shadow-xl">
              {options.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">No hay códigos activos.</p>
              ) : (
                options.map((code) => {
                  const isSelected = selectedCodes.some((c) => c.id === code.id);
                  return (
                    <label
                      key={code.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary/5 border-b border-(--border-main) last:border-0 ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCode(code)}
                        className="w-4 h-4 accent-primary shrink-0"
                      />
                      <span className="text-xs font-bold uppercase tracking-wide flex-1">
                        {formatDiscountLabel(code)}
                      </span>
                      {!code.is_active && (
                        <span className="text-[9px] text-gray-400 uppercase">inactivo</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCodes.map((code) => (
            <span
              key={code.id}
              className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg"
            >
              {code.code}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
