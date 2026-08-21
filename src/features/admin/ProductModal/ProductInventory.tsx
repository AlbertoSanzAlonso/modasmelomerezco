import React, { useRef, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { api } from '@/lib/api';
import type { Color, ProductVariant } from '@/types';
import {
  groupVariantsBySize,
  getUnusedColorsForSize,
  getColoredVariantsForSize,
  getBaseVariantForSize,
  getVariantColorName,
  ensureNeutroInCatalog,
  buildScopedColorName,
  getColorDisplayName,
} from '@/lib/productVariants';
import { SizeChecklist } from './SizeChecklist';
import { ColorHexPicker } from './ColorHexPicker';
import {
  canAddMoreSizes,
  isUniqueSize,
  UNIQUE_SIZE_LABEL,
} from './sizeMode';

/** Hex neutro para filas de estampado (la UI usa swatch_url). */
const PATTERN_FALLBACK_HEX = '#E8E4DF';

type ColorCreateMode = 'solid' | 'pattern';
interface ProductInventoryProps {
  variants: ProductVariant[];
  availableColors: Color[];
  productImages?: string[];
  /** ID del artículo: los colores nuevos quedan ligados solo a él */
  productId: string;
  /** Nombre del artículo: se usa en el nombre interno del color (amarillo_nombre-producto) */
  productName: string;
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
  catalog: Color[],
  productName?: string
): string {
  const colored = items.filter((v) => v.color_id != null);
  if (colored.length === 0) {
    const base = items.find((v) => v.color_id == null);
    return base ? `Stock: ${base.stock ?? 0} uds` : '';
  }
  const lines = colored.map((v) => {
    const name = getVariantColorName(v, catalog, productName) ?? 'Color';
    return `${name}: ${v.stock ?? 0} uds`;
  });
  const total = colored.reduce((s, v) => s + (v.stock ?? 0), 0);
  return `${lines.join(' · ')} (total ${total})`;
}

export const ProductInventory: React.FC<ProductInventoryProps> = ({
  variants = [],
  availableColors = [],
  productImages = [],
  productId,
  productName,
  onVariantsChange,
  onColorCreated,
}) => {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#8B4513');
  const [createMode, setCreateMode] = useState<ColorCreateMode>('solid');
  const [patternPreview, setPatternPreview] = useState<string | null>(null);
  const [patternFile, setPatternFile] = useState<File | null>(null);
  const [isCreatingColor, setIsCreatingColor] = useState(false);
  const [expandedSizes, setExpandedSizes] = useState<Record<string, boolean>>({});
  const patternInputRef = useRef<HTMLInputElement>(null);
  const catalog = ensureNeutroInCatalog(availableColors);
  const sizeGroups = groupVariantsBySize(variants);

  const sizeKey = (size: string) => (size.trim() ? size : '__new__');
  const isExpanded = (size: string) => expandedSizes[sizeKey(size)] === true;

  const toggleSize = (size: string) => {
    const key = sizeKey(size);
    setExpandedSizes((prev) => ({ ...prev, [key]: !isExpanded(size) }));
  };

  const migrateSizeUiState = (oldSize: string, newSize: string) => {
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

  const updateSizeLabel = (oldSize: string, newSize: string) => {
    onVariantsChange(
      variants.map((v) => (v.size === oldSize ? { ...v, size: newSize } : v))
    );
    migrateSizeUiState(oldSize, newSize);
  };

  const selectSize = (oldSize: string, newSize: string, groupItems: ProductVariant[]) => {
    if (isUniqueSize(newSize)) {
      const stock = groupItems.reduce((sum, v) => sum + (v.stock ?? 0), 0);
      const baseId = groupItems[0]?.id ?? `size-${Date.now()}`;
      onVariantsChange([
        {
          id: baseId,
          size: UNIQUE_SIZE_LABEL,
          color_id: null,
          stock,
        },
      ]);
      setExpandedSizes({ [sizeKey(UNIQUE_SIZE_LABEL)]: true });
      return;
    }

    updateSizeLabel(oldSize, newSize);
    if (!expandedSizes[sizeKey(newSize)]) {
      setExpandedSizes((prev) => ({ ...prev, [sizeKey(newSize)]: true }));
    }
  };

  const removeSize = (size: string) => {
    onVariantsChange(variants.filter((v) => v.size !== size));
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
    const id = Number(colorId);
    if (!Number.isInteger(id)) return;
    const duplicate = variants.some(
      (v) =>
        v.size === size &&
        Number(v.color_id) === id &&
        !variantMatches(v, row, size)
    );
    if (duplicate) return;

    const color = catalog.find((c) => Number(c.id) === id);
    onVariantsChange(
      variants.map((v) =>
        variantMatches(v, row, size)
          ? {
              ...v,
              color_id: id,
              color: color
                ? getColorDisplayName(color.name, productName)
                : undefined,
            }
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
    const id = Number(colorId);
    if (!Number.isInteger(id)) return;
    const exists = variants.some(
      (v) => v.size === size && Number(v.color_id) === id
    );
    if (exists) return;

    const color = catalog.find((c) => Number(c.id) === id);
    const base = getBaseVariantForSize(variants, size);
    const baseStock = base?.stock ?? 0;
    let next = variants.filter(
      (v) => !(v.size === size && v.color_id == null)
    );

    next = [
      ...next,
      {
        id: `v-${Date.now()}-${id}`,
        size,
        color_id: id,
        color: color
          ? getColorDisplayName(color.name, productName)
          : undefined,
        stock: base ? baseStock : 0,
      },
    ];

    onVariantsChange(next);
  };

  const clearPatternUpload = () => {
    if (patternPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(patternPreview);
    }
    setPatternPreview(null);
    setPatternFile(null);
    if (patternInputRef.current) patternInputRef.current.value = '';
  };

  const handlePatternFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (patternPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(patternPreview);
    }
    setPatternFile(file);
    setPatternPreview(URL.createObjectURL(file));
  };

  const handleCreateColor = async () => {
    const trimmedName = newColorName.trim();
    if (!trimmedName) return;

    if (createMode === 'pattern' && !patternFile) return;

    const productLabel = productName.trim() || 'producto';
    const displayExists = catalog.some(
      (c) =>
        getColorDisplayName(c.name, productLabel).toLowerCase() ===
        trimmedName.toLowerCase()
    );
    if (displayExists) {
      setNewColorName('');
      return;
    }

    const scopedName = buildScopedColorName(
      trimmedName,
      productLabel,
      catalog.map((c) => c.name)
    );

    const hex =
      createMode === 'pattern'
        ? PATTERN_FALLBACK_HEX
        : /^#[0-9A-Fa-f]{6}$/.test(newColorHex)
          ? newColorHex.toUpperCase()
          : '#8B4513';

    setIsCreatingColor(true);
    try {
      let swatch_url: string | null = null;
      if (createMode === 'pattern' && patternFile) {
        const ext = patternFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
          ? ext
          : 'jpg';
        const path = `${productId}/swatches/${Date.now()}.${safeExt}`;
        swatch_url = await api.storage.upload(patternFile, path);
      }

      const created = await api.colors.create({
        name: scopedName,
        hex,
        swatch_url,
        product_id: productId,
      });
      onColorCreated(created);
      setNewColorName('');
      setNewColorHex('#8B4513');
      clearPatternUpload();
      setCreateMode('solid');
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
          colores o estampados si la pieza existe en varios tonos; en la tienda
          solo entonces aparecerá el selector.
        </p>
      </div>

      <div className="bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl space-y-5">
        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
            Colores y estampados de este artículo
          </label>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            Se guarda como Nombre_producto (ej. Amarillo_vestido-lino). En la tienda
            solo se ve el nombre corto.
          </p>
        </div>

        <div className="flex gap-2 p-1 bg-(--bg-main) rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setCreateMode('solid')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              createMode === 'solid'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-(--text-main)'
            }`}
          >
            Color sólido
          </button>
          <button
            type="button"
            onClick={() => setCreateMode('pattern')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              createMode === 'pattern'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-(--text-main)'
            }`}
          >
            Estampado
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="space-y-2 flex-1 w-full min-w-0">
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
              Nombre
            </label>
            <input
              type="text"
              autoComplete="off"
              className="w-full bg-(--bg-main) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none rounded-xl"
              placeholder={
                createMode === 'pattern'
                  ? 'Ej: Floral, Rayas...'
                  : 'Ej: Marrón, Negro...'
              }
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              disabled={isCreatingColor}
            />
          </div>

          {createMode === 'solid' ? (
            <div className="w-full sm:w-[240px] shrink-0">
              <ColorHexPicker
                value={newColorHex}
                onChange={setNewColorHex}
                disabled={isCreatingColor}
                productImages={productImages}
              />
            </div>
          ) : (
            <div className="w-full sm:w-[240px] shrink-0 space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">
                Muestra del estampado
              </label>
              <input
                ref={patternInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePatternFileChange}
                disabled={isCreatingColor}
              />
              {patternPreview ? (
                <div className="relative flex items-center gap-3 bg-(--bg-main) border border-(--border-main) rounded-xl p-2">
                  <img
                    src={patternPreview}
                    alt="Muestra"
                    className="w-14 h-14 rounded-lg object-cover border border-black/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold truncate text-(--text-main)">
                      {patternFile?.name || 'Muestra'}
                    </p>
                    <button
                      type="button"
                      className="text-[9px] font-black uppercase text-primary mt-1"
                      onClick={() => patternInputRef.current?.click()}
                      disabled={isCreatingColor}
                    >
                      Cambiar
                    </button>
                  </div>
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-red-500"
                    onClick={clearPatternUpload}
                    disabled={isCreatingColor}
                    aria-label="Quitar muestra"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => patternInputRef.current?.click()}
                  disabled={isCreatingColor}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-primary/40 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  Subir muestra
                </button>
              )}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl whitespace-nowrap self-end"
            disabled={
              isCreatingColor ||
              !newColorName.trim() ||
              (createMode === 'pattern' && !patternFile)
            }
            onClick={handleCreateColor}
          >
            {isCreatingColor
              ? 'GUARDANDO...'
              : createMode === 'pattern'
                ? '+ CREAR ESTAMPADO'
                : '+ CREAR COLOR'}
          </Button>
        </div>
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
            const summary = stockSummary(group.items, catalog, productName);
            const open = isExpanded(group.size);

            return (
              <div
                key={group.size || `empty-${group.items[0]?.id}`}
                className="border border-(--border-main) rounded-2xl bg-(--bg-card)"
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
                  <div className="space-y-2 flex-1 min-w-[240px]">
                    <label className="text-[8px] font-black uppercase tracking-widest text-primary">
                      Talla
                    </label>
                    <SizeChecklist
                      currentSize={group.size}
                      variants={variants}
                      onSelect={(size) => selectSize(group.size, size, group.items)}
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
                  {!isUniqueSize(group.size) && (
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
                  )}
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
                            const colorRow = catalog.find(
                              (c) => Number(c.id) === Number(row.color_id)
                            );

                            return (
                              <tr key={row.variant_id ?? row.id ?? idx}>
                                <td className="py-4">
                                  <div className="flex items-center gap-3">
                                    <ColorSwatch
                                      color={
                                        colorRow ?? {
                                          hex: '#C4B8A8',
                                          name: row.color || 'Color',
                                        }
                                      }
                                      className="w-8 h-8 rounded-full shrink-0"
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
                                          {getColorDisplayName(c.name, productName)}
                                          {c.swatch_url ? ' (estampado)' : ''}
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
                      <div className="mt-4 pt-4 border-t border-(--border-main) space-y-3">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">
                          {hasColors
                            ? 'Añadir otro color a esta talla'
                            : 'Añadir variante de color'}
                        </label>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                          Pulsa un color para añadirlo
                        </p>
                        <div
                          className="flex flex-wrap gap-2"
                          role="listbox"
                          aria-label="Colores disponibles"
                        >
                          {unusedColors.map((c) => {
                            const label = getColorDisplayName(c.name, productName);
                            return (
                            <button
                              key={c.id}
                              type="button"
                              role="option"
                              title={`Añadir ${label}`}
                              onClick={() => addColorToSize(group.size, Number(c.id))}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-(--border-main) bg-(--bg-main) text-(--text-main) text-[10px] font-black uppercase tracking-wider transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
                            >
                              <ColorSwatch
                                color={{ ...c, name: label }}
                                className="w-4 h-4 rounded-full shrink-0"
                              />
                              {label}
                            </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canAddMoreSizes(variants) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl"
          onClick={addSize}
        >
          + AÑADIR TALLA
        </Button>
      )}
    </div>
  );
};
