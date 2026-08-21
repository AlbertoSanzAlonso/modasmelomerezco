import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { PRODUCT_PLACEHOLDER } from '@/lib/constants';
import { api } from '@/lib/api';
import {
  findVariant,
  formatVariantLabel,
  getColoredVariantsForSize,
  getColorDisplayName,
  getUniqueSizes,
  hasColorVariants,
  isOneSizeOnlyProduct,
  normalizeSize,
} from '@/lib/productVariants';
import { useCartStore } from '@/store/useCartStore';
import type { Product, ProductVariant } from '@/types';

interface SaleLine {
  key: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  variantId: string;
  size: string;
  colorId: number | null;
  colorName: string | null;
  quantity: number;
  availableStock: number;
}

function variantDbId(v: ProductVariant): string | null {
  if (v.variant_id != null) return String(v.variant_id);
  if (v.id && v.id !== 'undefined') return String(v.id);
  return null;
}

function lineKey(productId: string, variantId: string) {
  return `${productId}::${variantId}`;
}

export const DailySalesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const openModal = useCartStore((s) => s.openModal);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [lines, setLines] = useState<SaleLine[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ['admin-daily-sales-search', debouncedSearch],
    queryFn: () =>
      api.products.getAll(undefined, undefined, 1, 12, undefined, debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  const searchResults = searchData?.products ?? [];

  const variants = selectedProduct?.variants ?? [];
  const oneSizeOnly = isOneSizeOnlyProduct(variants);
  const requiresColor = hasColorVariants(variants);
  const sizes = useMemo(() => getUniqueSizes(variants), [variants]);
  const sizeForSelection = oneSizeOnly ? sizes[0] ?? '' : selectedSize;

  const colorsForSize = useMemo(() => {
    if (!sizeForSelection || !requiresColor) return [];
    return getColoredVariantsForSize(variants, sizeForSelection);
  }, [variants, sizeForSelection, requiresColor]);

  const activeVariant = useMemo(() => {
    if (!sizeForSelection) return undefined;
    if (requiresColor) {
      if (selectedColorId == null) return undefined;
      return findVariant(variants, sizeForSelection, { colorId: selectedColorId });
    }
    return findVariant(variants, sizeForSelection);
  }, [variants, sizeForSelection, requiresColor, selectedColorId]);

  const queuedForVariant = activeVariant
    ? lines
        .filter((l) => l.variantId === variantDbId(activeVariant))
        .reduce((sum, l) => sum + l.quantity, 0)
    : 0;

  const remainingStock = Math.max(0, (activeVariant?.stock ?? 0) - queuedForVariant);
  const maxQty = Math.max(1, remainingStock || 1);

  useEffect(() => {
    if (!selectedProduct) return;
    if (oneSizeOnly && sizes[0]) {
      setSelectedSize(sizes[0]);
    }
  }, [selectedProduct, oneSizeOnly, sizes]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedProduct?.product_id, sizeForSelection, selectedColorId]);

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize('');
    setSelectedColorId(null);
    setQuantity(1);
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const colorLabel = (v: ProductVariant) => {
    const raw =
      v.color ||
      selectedProduct?.colors?.find((c) => c.id === v.color_id)?.name ||
      `Color ${v.color_id}`;
    return getColorDisplayName(raw, selectedProduct?.name);
  };

  const swatchFor = (colorId: number | null) => {
    if (colorId == null) return null;
    return selectedProduct?.colors?.find((c) => c.id === colorId) ?? null;
  };

  const handleAddLine = () => {
    if (!selectedProduct || !activeVariant) {
      openModal({
        title: 'Falta selección',
        message: requiresColor
          ? 'Elige talla y color antes de añadir.'
          : 'Elige una talla antes de añadir.',
        type: 'warning',
      });
      return;
    }

    const vid = variantDbId(activeVariant);
    if (!vid) {
      openModal({
        title: 'Variante no válida',
        message: 'Esta variante no tiene identificador. Revisa el producto en inventario.',
        type: 'error',
      });
      return;
    }

    if (remainingStock <= 0) {
      openModal({
        title: 'Sin stock',
        message: 'No quedan unidades de esa talla/color (incluyendo lo ya añadido a la lista).',
        type: 'warning',
      });
      return;
    }

    const qty = Math.min(Math.max(1, quantity), remainingStock);
    const key = lineKey(selectedProduct.product_id, vid);
    const colorName = requiresColor ? colorLabel(activeVariant) : null;

    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key
            ? {
                ...l,
                quantity: Math.min(l.availableStock, l.quantity + qty),
              }
            : l
        );
      }
      return [
        ...prev,
        {
          key,
          productId: selectedProduct.product_id,
          productName: selectedProduct.name,
          imageUrl: selectedProduct.images?.[0],
          variantId: vid,
          size: normalizeSize(activeVariant.size),
          colorId: activeVariant.color_id ?? null,
          colorName,
          quantity: qty,
          availableStock: activeVariant.stock ?? 0,
        },
      ];
    });

    setQuantity(1);
    if (!oneSizeOnly) setSelectedSize('');
    setSelectedColorId(null);
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const applyMutation = useMutation({
    mutationFn: async (saleLines: SaleLine[]) => {
      for (const line of saleLines) {
        await api.products.decrementStock(line.variantId, line.quantity);
      }
    },
    onSuccess: () => {
      setLines([]);
      setSelectedProduct(null);
      setSelectedSize('');
      setSelectedColorId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['admin-daily-sales-search'] });
      openModal({
        title: 'Inventario actualizado',
        message: 'Las ventas del día se han restado del stock.',
        type: 'success',
      });
    },
    onError: (err: Error) => {
      openModal({
        title: 'Error',
        message: err.message || 'No se pudo restar el stock. Inténtalo de nuevo.',
        type: 'error',
      });
    },
  });

  const handleSubmit = () => {
    if (lines.length === 0) return;
    const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
    openModal({
      title: 'Restar del inventario',
      message: `¿Restar ${totalUnits} unidad${totalUnits === 1 ? '' : 'es'} en ${lines.length} línea${lines.length === 1 ? '' : 's'}? Esta acción no se puede deshacer desde aquí.`,
      type: 'confirm',
      onConfirm: () => applyMutation.mutate(lines),
    });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 md:gap-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">
            Ventas del día
          </h2>
          <p className="text-gray-500 text-sm">
            Selecciona lo vendido en tienda y réstalo del inventario al cierre.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Añadir venta */}
        <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-(--border-main)">
            <h3 className="font-black uppercase tracking-widest text-xs text-(--text-main)">
              Añadir artículo
            </h3>
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre…"
                className="w-full pl-11 pr-4 py-3 bg-(--bg-main) border border-(--border-main) rounded-2xl text-sm focus:outline-none focus:border-primary"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
              )}
            </div>

            {debouncedSearch.length >= 2 && !selectedProduct && (
              <div className="mt-3 max-h-64 overflow-y-auto border border-(--border-main) rounded-2xl divide-y divide-(--border-main)">
                {searchResults.length === 0 && !searching ? (
                  <p className="p-4 text-center text-xs text-gray-500 font-bold uppercase italic">
                    Sin resultados
                  </p>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.product_id}
                      type="button"
                      onClick={() => selectProduct(p)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-primary/5 transition-colors"
                    >
                      <img
                        src={p.images?.[0] || PRODUCT_PLACEHOLDER}
                        alt=""
                        className="w-12 h-12 object-cover rounded-xl bg-(--bg-main)"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold uppercase italic truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                          {p.price?.toFixed(2)}€
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedProduct ? (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedProduct.images?.[0] || PRODUCT_PLACEHOLDER}
                  alt=""
                  className="w-16 h-16 object-cover rounded-2xl bg-(--bg-main)"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-black uppercase italic text-sm truncate">
                    {selectedProduct.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedSize('');
                      setSelectedColorId(null);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-1"
                  >
                    Cambiar producto
                  </button>
                </div>
              </div>

              {!oneSizeOnly && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                    Talla
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const active = normalizeSize(selectedSize) === normalizeSize(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setSelectedSize(size);
                            setSelectedColorId(null);
                          }}
                          className={`min-w-12 px-3 py-2 text-xs font-black uppercase tracking-widest border rounded-xl transition-all ${
                            active
                              ? 'bg-secondary text-white border-secondary'
                              : 'border-(--border-main) text-(--text-main) hover:border-secondary/40'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {requiresColor && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                    Color
                  </p>
                  {!sizeForSelection ? (
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Elige una talla primero
                    </p>
                  ) : colorsForSize.length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Sin colores en esta talla
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {colorsForSize.map((v) => {
                        const active = selectedColorId === v.color_id;
                        const swatch = swatchFor(v.color_id);
                        const label = colorLabel(v);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedColorId(v.color_id)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition-all ${
                              active
                                ? 'border-secondary ring-2 ring-secondary/30'
                                : 'border-(--border-main) hover:border-secondary/40'
                            }`}
                            title={`${label} (${v.stock} uds)`}
                          >
                            {swatch ? (
                              <ColorSwatch
                                color={{ ...swatch, name: label }}
                                className="w-7 h-7 rounded-full"
                              />
                            ) : (
                              <span className="w-7 h-7 rounded-full border border-black/10 bg-gray-200" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {label}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold">
                              {v.stock}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
                    Cantidad
                    {activeVariant && (
                      <span className="ml-2 text-gray-400 normal-case tracking-normal font-bold">
                        (máx. {remainingStock})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={quantity}
                    disabled={!activeVariant || remainingStock <= 0}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (Number.isNaN(n)) {
                        setQuantity(1);
                        return;
                      }
                      setQuantity(Math.min(Math.max(1, n), remainingStock || 1));
                    }}
                    className="w-24 px-4 py-3 bg-(--bg-main) border border-(--border-main) rounded-2xl text-sm font-bold focus:outline-none focus:border-primary disabled:opacity-40"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddLine}
                  disabled={!activeVariant || remainingStock <= 0}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500 text-xs font-bold uppercase italic">
              Busca un producto para empezar
            </div>
          )}
        </div>

        {/* Lista del día */}
        <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 border-b border-(--border-main) flex justify-between items-center gap-3">
            <h3 className="font-black uppercase tracking-widest text-xs text-(--text-main)">
              Lista del día
            </h3>
            {lines.length > 0 && (
              <button
                type="button"
                onClick={() => setLines([])}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500"
              >
                Vaciar
              </button>
            )}
          </div>

          <div className="flex-1 divide-y divide-(--border-main) min-h-[200px]">
            {lines.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs font-bold uppercase italic">
                Aún no hay ventas en la lista
              </div>
            ) : (
              lines.map((line) => (
                <div
                  key={line.key}
                  className="p-4 sm:p-5 flex items-center gap-3"
                >
                  <img
                    src={line.imageUrl || PRODUCT_PLACEHOLDER}
                    alt=""
                    className="w-12 h-12 object-cover rounded-xl bg-(--bg-main) shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold uppercase italic truncate">
                      {line.productName}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {formatVariantLabel(line.size, line.colorName)}
                    </p>
                  </div>
                  <span className="text-sm font-black text-primary tabular-nums">
                    ×{line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Quitar línea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 sm:p-8 border-t border-(--border-main)">
            <Button
              type="button"
              className="w-full"
              disabled={lines.length === 0 || applyMutation.isPending}
              isLoading={applyMutation.isPending}
              onClick={handleSubmit}
            >
              Restar del inventario
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
