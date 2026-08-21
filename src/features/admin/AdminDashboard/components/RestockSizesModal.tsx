import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  ADMIN_SIZE_OPTIONS,
  isUniqueSize,
  UNIQUE_SIZE_LABEL,
} from '@/features/admin/ProductModal/sizeMode';
import { normalizeSize } from '@/lib/productVariants';

const RESTOCK_UNITS = 3;

interface RestockSizesModalProps {
  open: boolean;
  productCount: number;
  onClose: () => void;
  onConfirm: (sizes: string[]) => void;
  isSubmitting?: boolean;
}

export const RestockSizesModal: React.FC<RestockSizesModalProps> = ({
  open,
  productCount,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  if (!open) return null;

  const uniqueOn = selected.some((s) => isUniqueSize(s));

  const toggleSize = (size: string) => {
    if (isUniqueSize(size)) {
      setSelected([UNIQUE_SIZE_LABEL]);
      return;
    }
    setSelected((prev) => {
      const withoutUnique = prev.filter((s) => !isUniqueSize(s));
      const exists = withoutUnique.some(
        (s) => normalizeSize(s) === normalizeSize(size)
      );
      if (exists) {
        return withoutUnique.filter(
          (s) => normalizeSize(s) !== normalizeSize(size)
        );
      }
      return [...withoutUnique, size];
    });
  };

  const letterSizes = ADMIN_SIZE_OPTIONS.filter((s) => !isUniqueSize(s));

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Repor stock"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tight text-secondary">
              Volver a poner en stock
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Elige tallas (o Única). Se añadirán{' '}
              <strong className="text-secondary">{RESTOCK_UNITS} unidades</strong> por
              cada talla y color disponible
              {productCount > 1
                ? ` en los ${productCount} productos seleccionados`
                : ''}
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-primary">
            Tallas
          </p>
          <div className="flex flex-wrap gap-2">
            {letterSizes.map((size) => {
              const active =
                !uniqueOn &&
                selected.some((s) => normalizeSize(s) === normalizeSize(size));
              return (
                <button
                  key={size}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => toggleSize(size)}
                  className={`min-w-[3rem] px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                    active
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-gray-50 text-secondary border-gray-200 hover:border-primary/40'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => toggleSize(UNIQUE_SIZE_LABEL)}
            className={`w-full px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${
              uniqueOn
                ? 'bg-primary text-white border-primary'
                : 'bg-gray-50 text-secondary border-gray-200 hover:border-primary/40'
            }`}
          >
            Talla única
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl text-[10px] font-black uppercase"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl text-[10px] font-black uppercase"
            disabled={isSubmitting || selected.length === 0}
            onClick={() => onConfirm(selected)}
          >
            {isSubmitting ? 'Guardando…' : 'Confirmar stock'}
          </Button>
        </div>
      </div>
    </div>
  );
};
