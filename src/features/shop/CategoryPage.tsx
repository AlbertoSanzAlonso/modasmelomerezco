
import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product, Subcategory, Label } from '@/types';
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import { SeoHelmet } from '@/components/seo/SeoHelmet';
import { absoluteUrl, truncateDescription } from '@/lib/seo/constants';

function parseIdParam(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subQuery = searchParams.get('sub');
  const labelQuery = searchParams.get('label');

  // Fuente única de verdad: query params (evita carrera selected* vs URL)
  const selectedSub = parseIdParam(subQuery);
  const selectedLabel = parseIdParam(labelQuery);
  const filterKey = `${selectedSub ?? 'null'}-${selectedLabel ?? 'null'}`;

  const wasRestored = React.useRef(false);
  const lastFilterKey = React.useRef(`${category}-${filterKey}`);
  const allProductsLengthRef = React.useRef(0);

  const [page, setPage] = useState(() => {
    const savedPage = sessionStorage.getItem(`page-${category}-${filterKey}`);
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileLabelMenuOpen, setIsMobileLabelMenuOpen] = useState(false);

  allProductsLengthRef.current = allProducts.length;

  const applyFilters = (subId: number | null, labelId: number | null) => {
    if (subId === selectedSub && labelId === selectedLabel) return;

    const nextKey = `${subId ?? 'null'}-${labelId ?? 'null'}`;
    const params = new URLSearchParams();
    if (subId) params.set('sub', subId.toString());
    if (labelId) params.set('label', labelId.toString());

    sessionStorage.setItem(`page-${category}-${nextKey}`, '1');
    setPage(1);
    setAllProducts([]);
    wasRestored.current = false;
    setSearchParams(params);
  };

  // Al cambiar categoría/filtros: reset de lista y página (o restauración)
  React.useEffect(() => {
    if (lastFilterKey.current === `${category}-${filterKey}`) return;
    lastFilterKey.current = `${category}-${filterKey}`;

    const saved = sessionStorage.getItem(`page-${category}-${filterKey}`);
    setPage(saved ? parseInt(saved, 10) : 1);
    setAllProducts([]);
    wasRestored.current = false;
  }, [category, filterKey]);

  React.useEffect(() => {
    sessionStorage.setItem(`page-${category}-${filterKey}`, page.toString());
  }, [category, filterKey, page]);

  const handleSubChange = (subId: number | null) => {
    const id = subId == null ? null : Number(subId);
    const next = id !== null && selectedSub === id ? null : id;
    applyFilters(next, selectedLabel);
    setIsMobileMenuOpen(false);
  };

  const handleLabelChange = (labelId: number | null) => {
    const id = labelId == null ? null : Number(labelId);
    const next = id !== null && selectedLabel === id ? null : id;
    applyFilters(selectedSub, next);
    setIsMobileLabelMenuOpen(false);
  };

  const pageSize = 12;

  const { data: categoryData } = useQuery({
    queryKey: ['category-info', category],
    queryFn: () => api.categories.getByName(category!),
    enabled: !!category
  });

  const categoryId = categoryData?.id;

  const { data: subcategories } = useQuery<Subcategory[]>({
    queryKey: ['subcategories', categoryId],
    queryFn: () => api.categories.getSubcategories(categoryId!),
    enabled: !!categoryId
  });

  const { data: shopLabels } = useQuery<Label[]>({
    queryKey: ['labels'],
    queryFn: () => api.labels.getAll(),
  });

  const { data: productsData, isLoading, isFetching } = useQuery<{ products: Product[], total: number }>({
    queryKey: ['products', categoryId, selectedSub, selectedLabel, page],
    queryFn: () => {
      const isRestoring = page > 1 && allProductsLengthRef.current === 0;
      const actualPage = isRestoring ? 1 : page;
      const actualPageSize = isRestoring ? page * pageSize : pageSize;

      const catId = category?.toLowerCase() === 'todas' ? undefined : categoryId?.toString();

      return api.products.getAll(
        catId,
        selectedSub?.toString(),
        actualPage,
        actualPageSize,
        true,
        undefined,
        undefined,
        selectedLabel != null ? [selectedLabel] : undefined
      );
    },
    enabled: category?.toLowerCase() === 'todas' || !!categoryId,
    staleTime: 1000 * 60 * 5,
  });

  const products = productsData?.products;

  const restorationTrigger = allProducts.length;
  useScrollRestoration(
    `category-${category}-${filterKey}`,
    restorationTrigger
  );

  // Rellena/reemplaza la lista acumulada. Depende de filterKey para no quedarse
  // vacía si otro efecto limpia allProducts con la misma caché de React Query.
  React.useEffect(() => {
    if (!products) return;

    setAllProducts((prev) => {
      if (prev.length === 0 || page === 1) {
        if (products.length > pageSize) wasRestored.current = true;
        return products;
      }

      const existingIds = new Set(prev.map((p) => p.product_id));
      const newItems = products.filter((p) => !existingIds.has(p.product_id));
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [products, page, filterKey, pageSize]);

  // Si allProducts se vació en un render intermedio pero la query ya tiene datos, mostrarlos
  const visibleProducts =
    allProducts.length > 0 ? allProducts : page === 1 && products ? products : allProducts;

  const hasMore = productsData ? visibleProducts.length < productsData.total : false;

  const showEmptyState =
    !isLoading && !isFetching && !!productsData && visibleProducts.length === 0;

  const categoryTitle = categoryData?.name || category || 'Categoría';
  const categoryDescription = truncateDescription(
    `Descubre ${categoryTitle.toLowerCase()} en Modas Me lo Merezco. Moda para mujer con envío gratuito desde 50 €.`,
  );

  return (
    <div className="bg-accent min-h-screen pt-12 pb-32 text-secondary">
      <SeoHelmet
        title={categoryTitle}
        description={categoryDescription}
        path={`/categoria/${category}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Inicio',
              item: absoluteUrl('/'),
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: categoryTitle,
              item: absoluteUrl(`/categoria/${category}`),
            },
          ],
        }}
      />
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <header className="mb-20 text-center">
          <h1 className="text-[10vw] font-black tracking-tighter uppercase italic mb-6 leading-none">
            {category}
          </h1>
          
          {subcategories && subcategories.length > 0 && (
            <div className="mt-12">
              <div className="block md:hidden px-6 relative z-20">
                <div className="max-w-[280px] mx-auto">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen((open) => !open);
                      setIsMobileLabelMenuOpen(false);
                    }}
                    className="w-full bg-accent-dark border border-secondary/10 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-between group hover:border-primary/50 transition-all rounded-xl"
                  >
                    <span className="flex-1 text-center">
                      {selectedSub ? subcategories.find(s => s.id === selectedSub)?.name.toUpperCase() : 'TODAS LAS PIEZAS'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isMobileMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 bg-white border border-gray-100 shadow-2xl overflow-hidden rounded-2xl"
                      >
                        <div className="max-h-[60vh] overflow-y-auto py-2 space-y-1 px-2">
                          <button 
                            onClick={() => handleSubChange(null)}
                            className={`w-full flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-xl ${!selectedSub ? 'text-primary bg-primary/5' : 'text-secondary hover:bg-gray-50'}`}
                          >
                            TODAS LAS PIEZAS
                            {!selectedSub && <Check className="w-3 h-3" />}
                          </button>
                          {subcategories.map(sub => (
                            <button 
                              key={sub.id}
                              onClick={() => handleSubChange(sub.id)}
                              className={`w-full flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-xl ${selectedSub === sub.id ? 'text-primary bg-primary/5' : 'text-secondary hover:bg-gray-50'}`}
                            >
                              {sub.name}
                              {selectedSub === sub.id && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="hidden md:flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => handleSubChange(null)}
                  className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] border transition-all duration-300 rounded-full ${!selectedSub ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'border-secondary/10 hover:border-secondary hover:translate-y-[-2px]'}`}
                >
                  Todo
                </button>
                {subcategories.map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => handleSubChange(sub.id)}
                    className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] border transition-all duration-300 rounded-full ${selectedSub === sub.id ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'border-secondary/10 hover:border-secondary hover:translate-y-[-2px]'}`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {shopLabels && shopLabels.length > 0 && (
            <div className="mt-10">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary/40 mb-6 text-center">
                Filtrar por etiqueta
              </p>

              <div className="block md:hidden px-6 relative z-10">
                <div className="max-w-[280px] mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileLabelMenuOpen((open) => !open);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-accent-dark border border-secondary/10 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-between rounded-xl"
                  >
                    <span className="flex-1 text-center">
                      {selectedLabel
                        ? shopLabels.find((l) => l.id === selectedLabel)?.name.toUpperCase()
                        : 'TODAS LAS ETIQUETAS'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-primary transition-transform ${isMobileLabelMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isMobileLabelMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 bg-white border shadow-2xl overflow-hidden rounded-2xl"
                      >
                        <div className="max-h-[50vh] overflow-y-auto py-2 px-2 space-y-1">
                          <button
                            type="button"
                            onClick={() => handleLabelChange(null)}
                            className={`w-full flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl ${!selectedLabel ? 'text-primary bg-primary/5' : 'text-secondary'}`}
                          >
                            TODAS
                            {!selectedLabel && <Check className="w-3 h-3" />}
                          </button>
                          {shopLabels.map((label) => (
                            <button
                              key={label.id}
                              type="button"
                              onClick={() => handleLabelChange(Number(label.id))}
                              className={`w-full flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl ${selectedLabel === Number(label.id) ? 'text-primary bg-primary/5' : 'text-secondary'}`}
                            >
                              {label.name}
                              {selectedLabel === Number(label.id) && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="hidden md:flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleLabelChange(null)}
                  className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.25em] border rounded-full transition-all ${!selectedLabel ? 'bg-secondary border-secondary text-white' : 'border-secondary/10 hover:border-secondary'}`}
                >
                  Todas
                </button>
                {shopLabels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleLabelChange(Number(label.id))}
                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.25em] border rounded-full transition-all ${selectedLabel === Number(label.id) ? 'bg-secondary border-secondary text-white' : 'border-secondary/10 hover:border-secondary'}`}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {isLoading && page === 1 ? (
          <div className="space-y-12">
            <div className="flex flex-col items-center justify-center py-20">
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1.05, 1.3, 1],
                  rotate: [0, -5, 5, -5, 0],
                  opacity: [0.6, 1, 0.8, 1, 0.6]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.2, 0.4, 0.6, 1]
                }}
                className="relative"
              >
                <img src="/assets/logo/logo-corona.png" alt="Cargando..." className="w-12 h-12 object-contain" />
              </motion.div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-3/4 bg-white/5 animate-pulse rounded-3xl" />)}
            </div>
          </div>
        ) : showEmptyState ? (
          <div className="py-40 text-center">
            <p className="text-gray-500 uppercase tracking-[0.3em] font-bold">No hay artículos disponibles en esta categoría actualmente.</p>
          </div>
        ) : (
          <div className="space-y-20 relative z-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {visibleProducts.map((product: Product, index: number) => (
                <motion.div 
                  key={product.product_id}
                  id={`product-${product.product_id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: (index % pageSize) * 0.05,
                    ease: [0.21, 0, 0.07, 1]
                  }}
                  className="relative z-0"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-12">
                <button 
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={isFetching}
                  className="px-12 py-4 bg-transparent border-2 border-secondary text-secondary text-[10px] font-black uppercase tracking-[0.3em] hover:bg-secondary hover:text-white transition-all disabled:opacity-50 rounded-full"
                >
                  {isFetching ? 'Cargando más piezas...' : 'Ver más artículos'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
