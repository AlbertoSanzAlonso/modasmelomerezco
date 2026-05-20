import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Color, ProductVariant } from '@/types';
import {
  DEFAULT_COLOR,
  normalizeColor,
  isDefaultColor,
  groupVariantsBySize,
  getUnusedColorsForSize,
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

function stockSummary(items: ProductVariant[]): string {
  const lines = items.map(
    (v) => `${normalizeColor(v.color)}: ${v.stock ?? 0} uds`
  );
  if (lines.length === 0) return '';
  const total = items.reduce((s, v) => s + (v.stock ?? 0), 0);
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
  /** Por defecto todas las tallas vienen plegadas */
  const [expandedSizes, setExpandedSizes] = useState<Record<string, boolean>>({});

  const sizeKey = (size: string) => (size.trim() ? size : '__new__');
  const isExpanded = (size: string) => expandedSizes[sizeKey(size)] === true;

  const toggleSize = (size: string) => {
    const key = sizeKey(size);
    setExpandedSizes((prev) => ({ ...prev, [key]: !isExpanded(size) }));
  };

  const catalog = ensureNeutroInCatalog(availableColors);
  const sizeGroups = groupVariantsBySize(
    variants.map((v) => ({ ...v, color: normalizeColor(v.color) }))
  );

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
        color: DEFAULT_COLOR,
        stock: 0,
      },
    ]);
    setExpandedSizes((prev) => ({ ...prev, __new__: true }));
  };

  const updateRow = (
    row: ProductVariant,
    size: string,
    field: 'color' | 'stock',
    value: string | number
  ) => {
    onVariantsChange(
      variants.map((v) => {
        if (!variantMatches(v, row, size)) return v;
        if (field === 'color') {
          return { ...v, color: normalizeColor(String(value)) };
        }
        return { ...v, stock: Math.max(0, Number(value) || 0) };
      })
    );
  };

  const removeColorRow = (row: ProductVariant, size: string) => {
    const remaining = variants.filter((v) => !variantMatches(v, row, size));
    const stillHasSize = remaining.some((v) => v.size === size);
    if (!stillHasSize && size.trim()) {
      onVariantsChange([
        ...remaining,
        {
          id: `v-${Date.now()}`,
          size,
          color: DEFAULT_COLOR,
          stock: 0,
        },
      ]);
      return;
    }
    onVariantsChange(remaining);
  };

  const addColorToSize = (size: string, colorName: string) => {
    if (!colorName) return;
    const normalized = normalizeColor(colorName);
    const exists = variants.some(
      (v) => v.size === size && normalizeColor(v.color) === normalized
    );
    if (exists) return;

    onVariantsChange([
      ...variants,
      {
        id: `v-${Date.now()}-${normalized}`,
        size,
        color: normalized,
        stock: 0,
      },
    ]);
    setPendingColorBySize((prev) => ({ ...prev, [size]: '' }));
  };

  const handleCreateColor = async () => {
    const trimmedName = newColorName.trim();
    if (!trimmedName) return;
    if (trimmedName.toLowerCase() === DEFAULT_COLOR.toLowerCase()) {
      setNewColorName('');
      return;
    }

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
          Cada talla muestra sus colores con stock (Neutro, Marrón, Negro…). Los
          artículos que antes eran &quot;Único&quot; aparecen como Neutro y puedes
          cambiar color y unidades.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-4 bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl">
        <div className="space-y-2 flex-1 w-full">
          <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
            Otros colores del catálogo
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
          Añade una talla; por defecto incluirá la línea Neutro para el stock.
        </p>
      ) : (
        <div className="space-y-6">
          {sizeGroups.map((group) => {
            const colorRows = group.items;
            const unusedColors = getUnusedColorsForSize(
              variants.map((v) => ({ ...v, color: normalizeColor(v.color) })),
              group.size,
              catalog
            );
            const summary = stockSummary(colorRows);
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
                    aria-label={
                      open
                        ? `Ocultar colores de talla ${group.size || ''}`
                        : `Ver colores de talla ${group.size || ''}`
                    }
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
                      onChange={(e) => updateSizeLabel(group.size, e.target.value)}
                      placeholder="S"
                    />
                  </div>
                  {summary && (
                    <p className="flex-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">
                      {open ? 'Stock: ' : ''}
                      {summary}
                    </p>
                  )}
                  {!open && (
                    <button
                      type="button"
                      onClick={() => toggleSize(group.size)}
                      className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      Ver / editar colores
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
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-(--border-main)">
                        <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-gray-500 w-[45%]">
                          Color
                        </th>
                        <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-gray-500 w-[35%]">
                          Unidades en stock
                        </th>
                        <th className="pb-3 w-[20%]" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main)">
                      {colorRows.map((row, idx) => {
                        const colorName = normalizeColor(row.color);
                        const swatch =
                          catalog.find(
                            (c) =>
                              c.name.toLowerCase() === colorName.toLowerCase()
                          )?.hex ?? '#C4B8A8';
                        const canRemove = !(
                          isDefaultColor(colorName) &&
                          colorRows.length === 1
                        );

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
                                  value={colorName}
                                  onChange={(e) =>
                                    updateRow(
                                      row,
                                      group.size,
                                      'color',
                                      e.target.value
                                    )
                                  }
                                >
                                  {catalog.map((c) => (
                                    <option key={c.id} value={c.name}>
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
                                  updateRow(
                                    row,
                                    group.size,
                                    'stock',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                              />
                            </td>
                            <td className="py-4 text-right">
                              {canRemove ? (
                                <button
                                  type="button"
                                  className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500"
                                  onClick={() => removeColorRow(row, group.size)}
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <span className="text-[9px] text-gray-400 uppercase">
                                  Base
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

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
                        <option value="">Añadir otro color a esta talla...</option>
                        {unusedColors.map((c) => (
                          <option key={c.id} value={c.name}>
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
                            pendingColorBySize[group.size]
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
