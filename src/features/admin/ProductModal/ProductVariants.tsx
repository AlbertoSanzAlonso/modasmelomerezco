import React from 'react';
import { Button } from '@/components/ui/Button';
import type { Color, ProductVariant } from '@/types';
import { getUniqueSizes, syncVariants, UNIQUE_COLOR } from '@/lib/productVariants';

interface ProductVariantsProps {
  variants: ProductVariant[];
  colors: Color[];
  onVariantsChange: (variants: ProductVariant[]) => void;
}

export const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants = [],
  colors = [],
  onVariantsChange,
}) => {
  const sizes = getUniqueSizes(variants);
  const hasColors = colors.length > 0;
  const colorNames = hasColors ? colors.map((c) => c.name) : [UNIQUE_COLOR];

  const updateSizes = (newSizes: string[]) => {
    onVariantsChange(syncVariants(variants, newSizes, colors));
  };

  const updateStock = (size: string, color: string, stock: number) => {
    onVariantsChange(
      variants.map((v) =>
        v.size === size && (v.color || UNIQUE_COLOR) === color
          ? { ...v, stock: Math.max(0, stock) || 0 }
          : v
      )
    );
  };

  const handleAddSize = () => {
    updateSizes([...sizes, '']);
  };

  const handleRemoveSize = (index: number) => {
    updateSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSizeChange = (index: number, value: string) => {
    const newSizes = [...sizes];
    newSizes[index] = value;
    onVariantsChange(syncVariants(variants, newSizes, colors));
  };

  return (
    <div className="space-y-8 border-t border-(--border-main) pt-12">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block">
          Inventario por Talla
        </label>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
          {hasColors
            ? 'Define las tallas y el stock de cada combinación talla × color'
            : 'Define las tallas y el stock disponible (sin colores, se usa "Único")'}
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl"
          onClick={handleAddSize}
        >
          + AÑADIR TALLA
        </Button>
      </div>

      {sizes.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-4">
          Añade al menos una talla para gestionar el stock.
        </p>
      ) : hasColors ? (
        <div className="overflow-x-auto rounded-2xl border border-(--border-main)">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="bg-(--bg-card) border-b border-(--border-main)">
                <th className="p-4 text-[8px] font-black uppercase tracking-widest text-gray-500">
                  Talla
                </th>
                {colorNames.map((name) => (
                  <th
                    key={name}
                    className="p-4 text-[8px] font-black uppercase tracking-widest text-gray-500 text-center"
                  >
                    {name}
                  </th>
                ))}
                <th className="p-4 w-24" />
              </tr>
            </thead>
            <tbody>
              {sizes.map((size, index) => (
                <tr
                  key={`${size}-${index}`}
                  className="border-b border-(--border-main) last:border-0 bg-(--bg-card)/50"
                >
                  <td className="p-4">
                    <input
                      autoComplete="off"
                      className="w-full min-w-[80px] bg-(--bg-main) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none text-(--text-main) rounded-xl"
                      value={size}
                      onChange={(e) => handleSizeChange(index, e.target.value)}
                      placeholder="S, M, L..."
                    />
                  </td>
                  {colorNames.map((colorName) => {
                    const variant = variants.find(
                      (v) => v.size === size && (v.color || UNIQUE_COLOR) === colorName
                    );
                    return (
                      <td key={colorName} className="p-4">
                        <input
                          type="number"
                          min={0}
                          className="w-full min-w-[64px] bg-(--bg-main) border border-(--border-main) px-3 py-3 text-xs font-bold focus:border-primary outline-none text-(--text-main) rounded-xl text-center"
                          value={variant?.stock ?? 0}
                          onChange={(e) =>
                            updateStock(
                              size,
                              colorName,
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="p-4 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-xl font-black text-[10px]"
                      onClick={() => handleRemoveSize(index)}
                    >
                      QUITAR
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {sizes.map((size, index) => {
            const variant = variants.find((v) => v.size === size);
            return (
              <div
                key={`${size}-${index}`}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl"
              >
                <div className="space-y-3">
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                    Talla
                  </label>
                  <input
                    autoComplete="off"
                    className="w-full bg-(--bg-main) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none text-(--text-main) rounded-xl"
                    value={size}
                    onChange={(e) => handleSizeChange(index, e.target.value)}
                    placeholder="Ej: S, M, L o Única"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                    Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-(--bg-main) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none text-(--text-main) rounded-xl"
                    value={variant?.stock ?? 0}
                    onChange={(e) =>
                      updateStock(size, UNIQUE_COLOR, parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
                <div className="flex justify-end pt-2 sm:pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-xl font-black text-[10px] py-3"
                    onClick={() => handleRemoveSize(index)}
                  >
                    ELIMINAR
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
