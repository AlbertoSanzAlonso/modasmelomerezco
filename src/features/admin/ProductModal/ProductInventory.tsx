import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Color, ProductVariant } from '@/types';
import {
  groupVariantsBySize,
  getUnusedColorsForSize,
  getColoredVariantsForSize,
  getBaseVariantForSize,
  getVariantColorName,
  ensureNeutroInCatalog,
} from '@/lib/productVariants';

interface ProductInventoryProps {
  variants: ProductVariant[];
  availableColors: Color[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  onColorCreated: (color: Color) => void;
}

const variantMatches = (a: ProductVariant, b: ProductVariant, size: string) =>
  a.size === size &&
  (a.variant_id && b.variant_id
    ? a.variant_id === b.variant_id
    : a.id === b.id);

function stockSummary(
  items: ProductVariant[],
  catalog: Color[]
): string {
  const colored = items.filter((v) => v.color_id != null);
  if (colored.length === 0) {
    const base = items.find((v) => v.color_id == null);
    return base ? `Stock: ${base.stock ?? 0} uds` : '';
  }
  const lines = colored.map((v) => {
    const name = getVariantColorName(v, catalog) ?? 'Color';
    return `${name}: ${v.stock ?? 0} uds`;
  });
  const total = colored.reduce((s, v) => s + (v.stock ?? 0), 0);
  return `${lines.join(' · ')} (total ${total})`;
}

export const ProductInventory: React.FC<ProductInventoryProps> = ({
  variants = [],
  availableColors = [],
  onVariantsChange,
  onColorCreated,
}) => {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#8B4513');
  const [isCreatingColor, setIsCreatingColor] = useState(false);
  const [pendingColorBySize, setPendingColorBySize] = useState<Record<string, string>>({});
  const [expandedSizes, setExpandedSizes] = useState<Record<string, boolean>>({});

  const catalog = ensureNeutroInCatalog(availableColors);
  const sizeGroups = groupVariantsBySize(variants);

  const sizeKey = (size: string) => (size.trim() ? size : '__new__');
  const isExpanded = (size: string) => expandedSizes[sizeKey(size)] === true;

  const toggleSize = (size: string) => {
    const key = sizeKey(size);
    setExpandedSizes((prev) => ({ ...prev, [key]: !isExpanded(size) }));
  };

  const updateSizeLabel = (oldSize: string, newSize: string) => {
    onVariantsChange(
      variants.map((v) => (v.size === oldSize ? { ...v, size: newSize } : v))
    );
    if (pendingColorBySize[oldSize] !== undefined) {
      setPendingColorBySize((prev) => {
        const next = { ...prev };
        next[newSize] = next[oldSize];
        delete next[oldSize];
        return next;
      });
    }
    const oldKey = sizeKey(oldSize);
    if (expandedSizes[oldKey] !== undefined) {
      setExpandedSizes((prev) => {
        const next = { ...prev };
        next[sizeKey(newSize)] = next[oldKey];
        delete next[oldKey];
        return next;
      });
    }
  };

  const removeSize = (size: string) => {
    onVariantsChange(variants.filter((v) => v.size !== size));
    setPendingColorBySize((prev) => {
      const next = { ...prev };
      delete next[size];
      return next;
    });
    setExpandedSizes((prev) => {
      const next = { ...prev };
      delete next[sizeKey(size)];
      return next;
    });
  };

  const addSize = () => {
    onVariantsChange([
      ...variants,
      {
        id: `size-${Date.now()}`,
        size: '',
        color_id: null,
        stock: 0,
      },
    ]);
    setExpandedSizes((prev) => ({ ...prev, __new__: true }));
  };

  const updateRowStock = (row: ProductVariant, size: string, stock: number) => {
    onVariantsChange(
      variants.map((v) =>
        variantMatches(v, row, size) ? { ...v, stock: Math.max(0, stock) } : v
      )
    );
  };

  const updateRowColorId = (
    row: ProductVariant,
    size: string,
    colorId: number
  ) => {
    const color = catalog.find((c) => c.id === colorId);
    onVariantsChange(
      variants.map((v) =>
        variantMatches(v, row, size)
          ? { ...v, color_id: colorId, color: color?.name }
          : v
      )
    );
  };

  const removeColorRow = (row: ProductVariant, size: string) => {
    const remaining = variants.filter((v) => !variantMatches(v, row, size));
    const coloredLeft = getColoredVariantsForSize(remaining, size);
    if (coloredLeft.length === 0 && size.trim()) {
      const base = getBaseVariantForSize(remaining, size);
      onVariantsChange([
        ...remaining.filter((v) => v.size !== size || v.color_id != null),
        base ?? {
          id: `base-${size}-${Date.now()}`,
          size,
          color_id: null,
          stock: 0,
        },
      ]);
      return;
    }
    onVariantsChange(remaining);
  };

  const addColorToSize = (size: string, colorId: number) => {
    if (!colorId) return;
    const exists = variants.some(
      (v) => v.size === size && v.color_id === colorId
    );
    if (exists) return;

    const color = catalog.find((c) => c.id === colorId);
    const base = getBaseVariantForSize(variants, size);
    const baseStock = base?.stock ?? 0;
    let next = variants.filter(
      (v) => !(v.size === size && v.color_id == null)
    );

    next = [
      ...next,
      {
        id: `v-${Date.now()}-${colorId}`,
        size,
        color_id: colorId,
        color: color?.name,
        stock: base ? baseStock : 0,
      },
    ];

    onVariantsChange(next);
    setPendingColorBySize((prev) => ({ ...prev, [size]: '' }));
  };

  const handleCreateColor = async () => {
    const trimmedName = newColorName.trim();
    if (!trimmedName) return;

    const exists = catalog.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      setNewColorName('');
      return;
    }

    setIsCreatingColor(true);
    try {
      const created = await api.colors.create({
        name: trimmedName,
        hex: newColorHex,
      });
      onColorCreated(created);
      setNewColorName('');
      setNewColorHex('#8B4513');
    } catch (error) {
      console.error('Error creating color:', error);
    } finally {
      setIsCreatingColor(false);
    }
  };

  return (
    <div className="space-y-8 border-t border-(--border-main) pt-12">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block">
          Inventario por Talla y Color
        </label>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-relaxed">
          Por defecto cada talla solo tiene stock (sin variantes de color). Añade
          colores si el producto existe en varios tonos; en la tienda solo entonces
          aparecerá el selector de color.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-4 bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl">
        <div className="space-y-2 flex-1 w-full">
          <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
            Colores del catálogo
          </label>
          <input
            type="text"
            autoComplete="off"
            className="w-full bg-(--bg-main) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none rounded-xl"
            placeholder="Ej: Marrón, Negro..."
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            disabled={isCreatingColor}
          />
        </div>
        <input
          type="color"
          className="w-12 h-12 border-0 p-0 cursor-pointer rounded-xl"
          value={newColorHex}
          onChange={(e) => setNewColorHex(e.target.value)}
          disabled={isCreatingColor}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl whitespace-nowrap"
          disabled={isCreatingColor || !newColorName.trim()}
          onClick={handleCreateColor}
        >
          {isCreatingColor ? 'GUARDANDO...' : '+ CREAR COLOR'}
        </Button>
      </div>

      {sizeGroups.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">
          Añade una talla e indica las unidades en stock.
        </p>
      ) : (
        <div className="space-y-6">
          {sizeGroups.map((group) => {
            const coloredRows = getColoredVariantsForSize(variants, group.size);
            const baseRow =
              getBaseVariantForSize(variants, group.size) ??
              (coloredRows.length === 0
                ? group.items.find((v) => v.color_id == null)
                : undefined);
            const hasColors = coloredRows.length > 0;
            const unusedColors = getUnusedColorsForSize(
              variants,
              group.size,
              catalog
            );
            const summary = stockSummary(group.items, catalog);
            const open = isExpanded(group.size);

            return (
              <div
                key={group.size || `empty-${group.items[0]?.id}`}
                className="border border-(--border-main) rounded-2xl overflow-hidden bg-(--bg-card)"
              >
                <div
                  className={`flex flex-wrap items-center gap-4 p-5 bg-primary/5 ${
                    open ? 'border-b border-(--border-main)' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSize(group.size)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-(--text-main) transition-colors shrink-0"
                    aria-expanded={open}
                  >
                    {open ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-primary">
                      Talla
                    </label>
                    <input
                      autoComplete="off"
                      className="w-28 bg-(--bg-main) border border-(--border-main) px-4 py-3 text-sm font-black focus:border-primary outline-none rounded-xl uppercase"
                      value={group.size}
                      onChange={(e) =>
                        updateSizeLabel(group.size, e.target.value)
                      }
                      placeholder="S"
                    />
                  </div>
                  {summary && (
                    <p className="flex-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">
                      {open ? '' : summary}
                    </p>
                  )}
                  {!open && (
                    <button
                      type="button"
                      onClick={() => toggleSize(group.size)}
                      className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      Ver / editar stock
                    </button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500/20 font-black text-[10px] rounded-xl ml-auto"
                    onClick={() => removeSize(group.size)}
                  >
                    <Trash2 className="w-3 h-3 mr-1 inline" />
                    QUITAR TALLA
                  </Button>
                </div>

                {open && (
                  <div className="p-5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {!hasColors && baseRow && (
                      <div className="flex flex-wrap items-end gap-4 mb-6">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                            Unidades en stock (sin color)
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="w-full max-w-[140px] bg-(--bg-main) border border-(--border-main) px-4 py-3 text-sm font-black focus:border-primary outline-none rounded-xl text-center"
                            value={baseRow.stock ?? 0}
                            onChange={(e) =>
                              updateRowStock(
                                baseRow,
                                group.size,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                    )}

                    {hasColors && (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-(--border-main)">
                            <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-gray-500 w-[45%]">
                              Color
                            </th>
                            <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-gray-500 w-[35%]">
                              Unidades
                            </th>
                            <th className="pb-3 w-[20%]" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-main)">
                          {coloredRows.map((row, idx) => {
                            const swatch =
                              catalog.find((c) => c.id === row.color_id)?.hex ??
                              '#C4B8A8';

                            return (
                              <tr key={row.variant_id ?? row.id ?? idx}>
                                <td className="py-4">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="w-8 h-8 rounded-full border border-black/10 shadow-inner shrink-0"
                                      style={{ backgroundColor: swatch }}
                                    />
                                    <select
                                      className="flex-1 bg-(--bg-main) border border-(--border-main) px-3 py-2.5 text-xs font-black uppercase focus:border-primary outline-none rounded-xl cursor-pointer"
                                      value={row.color_id ?? ''}
                                      onChange={(e) =>
                                        updateRowColorId(
                                          row,
                                          group.size,
                                          Number(e.target.value)
                                        )
                                      }
                                    >
                                      {catalog.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full max-w-[120px] bg-(--bg-main) border border-(--border-main) px-4 py-3 text-sm font-black focus:border-primary outline-none rounded-xl text-center"
                                    value={row.stock ?? 0}
                                    onChange={(e) =>
                                      updateRowStock(
                                        row,
                                        group.size,
                                        parseInt(e.target.value, 10) || 0
                                      )
                                    }
                                  />
                                </td>
                                <td className="py-4 text-right">
                                  <button
                                    type="button"
                                    className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500"
                                    onClick={() =>
                                      removeColorRow(row, group.size)
                                    }
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {unusedColors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-(--border-main)">
                        <select
                          className="flex-1 min-w-[180px] max-w-xs bg-(--bg-main) border border-primary/40 px-4 py-3 text-xs font-bold focus:border-primary outline-none rounded-xl cursor-pointer"
                          value={pendingColorBySize[group.size] ?? ''}
                          onChange={(e) =>
                            setPendingColorBySize((prev) => ({
                              ...prev,
                              [group.size]: e.target.value,
                            }))
                          }
                        >
                          <option value="">
                            {hasColors
                              ? 'Añadir otro color a esta talla...'
                              : 'Añadir variante de color...'}
                          </option>
                          {unusedColors.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl gap-1"
                          disabled={!pendingColorBySize[group.size]}
                          onClick={() =>
                            addColorToSize(
                              group.size,
                              Number(pendingColorBySize[group.size])
                            )
                          }
                        >
                          <Plus className="w-3 h-3" />
                          AÑADIR COLOR
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl"
        onClick={addSize}
      >
        + AÑADIR TALLA
      </Button>
    </div>
  );
};
