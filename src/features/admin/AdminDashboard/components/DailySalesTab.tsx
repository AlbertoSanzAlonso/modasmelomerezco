import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Minus, Plus, Search, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { PRODUCT_PLACEHOLDER } from '@/lib/constants';
import { toDisplayImageUrl } from '@/lib/mediaUrl';
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

interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  variantId: string;
  size: string;
  colorName: string | null;
  delta: number;
  resultingStock: number;
  at: number;
}

function variantDbId(v: ProductVariant): string | null {
  if (v.variant_id != null) return String(v.variant_id);
  if (v.id && v.id !== 'undefined') return String(v.id);
  return null;
}

function invalidateStockQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.invalidateQueries({ queryKey: ['product'] });
  queryClient.invalidateQueries({ queryKey: ['admin-store-stock-search'] });
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
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!statusMessage) return;
    const t = window.setTimeout(() => setStatusMessage(null), 2000);
    return () => window.clearTimeout(t);
  }, [statusMessage]);

  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ['admin-store-stock-search', debouncedSearch],
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

  const currentStock = activeVariant?.stock ?? 0;
  const activeVariantId = activeVariant ? variantDbId(activeVariant) : null;

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

  const patchLocalStock = (variantId: string, newStock: number) => {
    setSelectedProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: prev.variants.map((v) =>
          variantDbId(v) === variantId ? { ...v, stock: newStock } : v
        ),
      };
    });
  };

  const adjustMutation = useMutation({
    mutationFn: async ({
      variantId,
      delta,
      meta,
    }: {
      variantId: string;
      delta: number;
      meta: Omit<StockHistoryEntry, 'id' | 'delta' | 'resultingStock' | 'at'>;
    }) => {
      const resultingStock = await api.products.adjustStock(variantId, delta);
      return { resultingStock, delta, variantId, meta };
    },
    onSuccess: ({ resultingStock, delta, variantId, meta }) => {
      patchLocalStock(variantId, resultingStock);
      setHistory((prev) => [
        {
          id: `${Date.now()}-${variantId}-${delta}`,
          ...meta,
          variantId,
          delta,
          resultingStock,
          at: Date.now(),
        },
        ...prev,
      ].slice(0, 30));
      setStatusMessage(
        delta > 0
          ? `+${delta} → ${resultingStock} uds`
          : `${delta} → ${resultingStock} uds`
      );
      invalidateStockQueries(queryClient);
    },
    onError: (err: Error) => {
      openModal({
        title: 'Error',
        message: err.message || 'No se pudo ajustar el stock. Inténtalo de nuevo.',
        type: 'error',
      });
    },
  });

  const undoMutation = useMutation({
    mutationFn: async (entry: StockHistoryEntry) => {
      const reverseDelta = -entry.delta;
      const resultingStock = await api.products.adjustStock(
        entry.variantId,
        reverseDelta
      );
      return { entry, resultingStock, reverseDelta };
    },
    onSuccess: ({ entry, resultingStock }) => {
      if (selectedProduct?.product_id === entry.productId) {
        patchLocalStock(entry.variantId, resultingStock);
      }
      setHistory((prev) => prev.filter((h) => h.id !== entry.id));
      setStatusMessage(`Deshecho → ${resultingStock} uds`);
      invalidateStockQueries(queryClient);
    },
    onError: (err: Error) => {
      openModal({
        title: 'Error',
        message: err.message || 'No se pudo deshacer el cambio.',
        type: 'error',
      });
    },
  });

  const applyDelta = (signedStep: number) => {
    if (!selectedProduct || !activeVariant || !activeVariantId) {
      openModal({
        title: 'Falta selección',
        message: requiresColor
          ? 'Elige talla y color antes de ajustar.'
          : 'Elige una talla antes de ajustar.',
        type: 'warning',
      });
      return;
    }

    const qty = Math.max(1, Math.trunc(quantity) || 1);
    if (signedStep < 0 && currentStock <= 0) {
      openModal({
        title: 'Sin stock',
        message: 'No quedan unidades de esa talla/color.',
        type: 'warning',
      });
      return;
    }

    const delta = signedStep < 0 ? -Math.min(qty, currentStock) : qty;

    adjustMutation.mutate({
      variantId: activeVariantId,
      delta,
      meta: {
        productId: selectedProduct.product_id,
        productName: selectedProduct.name,
        imageUrl: selectedProduct.images?.[0],
        size: normalizeSize(activeVariant.size),
        colorName: requiresColor ? colorLabel(activeVariant) : null,
      },
    });
  };

  const busy = adjustMutation.isPending || undoMutation.isPending;
  const canAdjust = Boolean(activeVariant && activeVariantId) && !busy;
  const latestEntry = history[0] ?? null;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 md:gap-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">
            Tienda
          </h2>
          <p className="text-gray-500 text-sm">
            Registra ventas o reposición de stock al momento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-(--border-main)">
            <h3 className="font-black uppercase tracking-widest text-xs text-(--text-main)">
              Buscar producto
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
                        src={toDisplayImageUrl(p.images?.[0]) || PRODUCT_PLACEHOLDER}
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
                  src={toDisplayImageUrl(selectedProduct.images?.[0]) || PRODUCT_PLACEHOLDER}
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

              <div className="rounded-3xl border border-(--border-main) bg-(--bg-main) p-6 space-y-5">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Stock actual
                    {activeVariant && (
                      <span className="ml-2 text-gray-400 normal-case tracking-normal font-bold">
                        ({formatVariantLabel(
                          normalizeSize(activeVariant.size),
                          requiresColor ? colorLabel(activeVariant) : null
                        )})
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-5xl font-black tabular-nums tracking-tighter ${
                      !activeVariant
                        ? 'text-gray-300'
                        : currentStock <= 0
                          ? 'text-red-500'
                          : 'text-(--text-main)'
                    }`}
                  >
                    {activeVariant ? currentStock : '—'}
                  </p>
                  {statusMessage && (
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">
                      {statusMessage}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2 text-center">
                        Cantidad
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={busy || quantity <= 1}
                          className="w-11 h-11 rounded-xl border border-(--border-main) bg-(--bg-card) flex items-center justify-center disabled:opacity-40"
                          aria-label="Bajar cantidad"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={quantity}
                          disabled={busy}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (Number.isNaN(n)) {
                              setQuantity(1);
                              return;
                            }
                            setQuantity(Math.min(99, Math.max(1, n)));
                          }}
                          className="w-20 px-3 py-3 bg-(--bg-card) border border-(--border-main) rounded-2xl text-sm font-bold text-center focus:outline-none focus:border-primary disabled:opacity-40"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                          disabled={busy || quantity >= 99}
                          className="w-11 h-11 rounded-xl border border-(--border-main) bg-(--bg-card) flex items-center justify-center disabled:opacity-40"
                          aria-label="Subir cantidad"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => applyDelta(-1)}
                      disabled={!canAdjust || currentStock <= 0}
                      className="min-h-16 px-4 rounded-2xl border-2 border-(--border-main) bg-(--bg-card) flex flex-col items-center justify-center gap-1 text-(--text-main) hover:border-red-400 hover:text-red-500 disabled:opacity-40 disabled:hover:border-(--border-main) disabled:hover:text-(--text-main) transition-colors"
                      aria-label={`Venta: restar ${quantity}`}
                    >
                      {adjustMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span className="flex items-center gap-2 font-black uppercase tracking-widest text-xs">
                            <Minus className="w-4 h-4" strokeWidth={3} />
                            Venta
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            −{quantity} uds
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => applyDelta(1)}
                      disabled={!canAdjust}
                      className="min-h-16 px-4 rounded-2xl border-2 border-primary bg-primary text-white flex flex-col items-center justify-center gap-1 hover:opacity-90 disabled:opacity-40 transition-opacity"
                      aria-label={`Reposición: sumar ${quantity}`}
                    >
                      {adjustMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span className="flex items-center gap-2 font-black uppercase tracking-widest text-xs">
                            <Plus className="w-4 h-4" strokeWidth={3} />
                            Reposición
                          </span>
                          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                            +{quantity} uds
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!activeVariant && (
                  <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {requiresColor
                      ? 'Elige talla y color para ajustar'
                      : 'Elige una talla para ajustar'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500 text-xs font-bold uppercase italic">
              Busca un producto para empezar
            </div>
          )}
        </div>

        <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 border-b border-(--border-main) flex justify-between items-center gap-3">
            <h3 className="font-black uppercase tracking-widest text-xs text-(--text-main)">
              Últimos cambios
            </h3>
            {latestEntry && (
              <Button
                type="button"
                variant="outline"
                className="gap-2 text-[10px] h-9 px-3"
                disabled={busy}
                isLoading={undoMutation.isPending}
                onClick={() => undoMutation.mutate(latestEntry)}
              >
                <Undo2 className="w-3.5 h-3.5" />
                Deshacer último
              </Button>
            )}
          </div>

          <div className="flex-1 divide-y divide-(--border-main) min-h-[200px]">
            {history.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs font-bold uppercase italic">
                Los ajustes de esta sesión aparecerán aquí
              </div>
            ) : (
              history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="p-4 sm:p-5 flex items-center gap-3"
                >
                  <img
                    src={toDisplayImageUrl(entry.imageUrl) || PRODUCT_PLACEHOLDER}
                    alt=""
                    className="w-12 h-12 object-cover rounded-xl bg-(--bg-main) shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold uppercase italic truncate">
                      {entry.productName}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {formatVariantLabel(entry.size, entry.colorName)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-black tabular-nums ${
                        entry.delta > 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold tabular-nums">
                      → {entry.resultingStock}
                    </p>
                  </div>
                  {index === 0 && (
                    <button
                      type="button"
                      onClick={() => undoMutation.mutate(entry)}
                      disabled={busy}
                      className="p-2 text-gray-400 hover:text-primary transition-colors disabled:opacity-40"
                      aria-label="Deshacer este cambio"
                      title="Deshacer"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
