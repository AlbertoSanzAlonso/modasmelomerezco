
import React from 'react';
import { Button } from "@/components/ui/Button";

interface ProductVariantsProps {
  variants: any[];
  onAddVariant: () => void;
  onRemoveVariant: (index: number) => void;
  onVariantChange: (index: number, field: string, value: any) => void;
}

export const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants,
  onAddVariant,
  onRemoveVariant,
  onVariantChange
}) => {
  return (
    <div className="space-y-8 border-t border-[var(--border-main)] pt-12">
      <div className="flex justify-end items-center">
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          className="text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl"
          onClick={onAddVariant}
        >
          + AÑADIR TALLA
        </Button>
      </div>
      
      <div className="space-y-4">
        {variants?.map((variant, index) => (
          <div key={variant.id} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end bg-[var(--bg-card)] p-6 border border-[var(--border-main)] rounded-2xl relative group/variant transition-all hover:border-primary/20">
            <div className="space-y-3">
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Talla</label>
              <input 
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-4 py-3 text-xs font-bold focus:border-primary outline-none text-[var(--text-main)] rounded-xl"
                value={variant.size}
                onChange={(e) => onVariantChange(index, 'size', e.target.value)}
                placeholder="Ej: S, M, L o Única"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Stock</label>
              <input 
                type="number"
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-4 py-3 text-xs font-bold focus:border-primary outline-none text-[var(--text-main)] rounded-xl"
                value={variant.stock}
                onChange={(e) => onVariantChange(index, 'stock', parseInt(e.target.value))}
              />
            </div>
            <div className="flex justify-end pt-2 sm:pt-0">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-xl transition-all font-black text-[10px] py-3"
                onClick={() => onRemoveVariant(index)}
              >
                ELIMINAR
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
