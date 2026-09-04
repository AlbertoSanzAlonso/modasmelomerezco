
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

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subQuery = searchParams.get('sub');
  const labelQuery = searchParams.get('label');

  const filterKey = `${subQuery || 'null'}-${labelQuery || 'null'}`;

  // Ref to track if we have already performed the initial restoration
  const wasRestored = React.useRef(false);

  const [selectedSub, setSelectedSub] = useState<number | null>(() =>
    subQuery ? parseInt(subQuery, 10) : null
  );
  const [selectedLabel, setSelectedLabel] = useState<number | null>(() =>
    labelQuery ? parseInt(labelQuery, 10) : null
  );

  const [page, setPage] = useState(() => {
    const savedPage = sessionStorage.getItem(`page-${category}-${filterKey}`);
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileLabelMenuOpen, setIsMobileLabelMenuOpen] = useState(false);

  const lastState = React.useRef({ category, subQuery, labelQuery });

  const applyFilters = (subId: number | null, labelId: number | null) => {
    const params = new URLSearchParams();
    if (subId) params.set('sub', subId.toString());
    if (labelId) params.set('label', labelId.toString());
    setSearchParams(params);
    setPage(1);
    setAllProducts([]);
    wasRestored.current = false;
  };

  React.useEffect(() => {
    if (
      lastState.current.category !== category ||
      lastState.current.subQuery !== subQuery ||
      lastState.current.labelQuery !== labelQuery
    ) {
      setSelectedSub(subQuery ? parseInt(subQuery, 10) : null);
      setSelectedLabel(labelQuery ? parseInt(labelQuery, 10) : null);

      const saved = sessionStorage.getItem(
        `page-${category}-${subQuery || 'null'}-${labelQuery || 'null'}`
      );
      setPage(saved ? parseInt(saved, 10) : 1);
      setAllProducts([]);
      wasRestored.current = false;

      lastState.current = { category, subQuery, labelQuery };
    }
  }, [subQuery, labelQuery, category]);

  React.useEffect(() => {
    sessionStorage.setItem(
      `page-${category}-${selectedSub || 'null'}-${selectedLabel || 'null'}`,
      page.toString()
    );
  }, [category, selectedSub, selectedLabel, page]);

  const handleSubChange = (subId: number | null) => {
    setSelectedSub(subId);
    applyFilters(subId, selectedLabel);
    setIsMobileMenuOpen(false);
  };

  const handleLabelChange = (labelId: number | null) => {
    setSelectedLabel(labelId);
    applyFilters(selectedSub, labelId);
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
      const isRestoring = page > 1 && allProducts.length === 0;
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
        selectedLabel ?? undefined
      );
    },
    enabled: category?.toLowerCase() === 'todas' || !!categoryId,
    staleTime: 1000 * 60 * 5,
  });

  const products = productsData?.products;

  // Restore scroll position
  // We use a more stable trigger for restoration
  const restorationTrigger = allProducts.length;
  useScrollRestoration(
    `category-${category}-${selectedSub || 'null'}-${selectedLabel || 'null'}`,
    restorationTrigger
  );

  React.useEffect(() => {
    if (products) {
      setAllProducts(prev => {
        // Case A: First load or restoration load
        if (prev.length === 0 || page === 1) {
          // If we are restoring multiple pages, mark it so the hook knows we have content
          if (products.length > pageSize) wasRestored.current = true;
          return products;
        } 
        
        // Case B: Normal pagination append
        // Avoid duplicates if any
        const existingIds = new Set(prev.map(p => p.product_id));
        const newItems = products.filter(p => !existingIds.has(p.product_id));
        if (newItems.length === 0) return prev;
        return [...prev, ...newItems];
      });
    }
  }, [products, page]);


  const hasMore = productsData ? allProducts.length < productsData.total : false;

  // Helper to determine if we should show the empty state
  const showEmptyState = !isLoading && !isFetching && productsData && allProducts.length === 0;

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
              <div className="block md:hidden px-6 relative z-50">
                <div className="max-w-[280px] mx-auto">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-6 right-6 mt-2 bg-white border border-gray-100 shadow-2xl z-50 overflow-hidden rounded-2xl"
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

              <div className="block md:hidden px-6 relative z-50">
                <div className="max-w-[280px] mx-auto">
                  <button
                    type="button"
                    onClick={() => setIsMobileLabelMenuOpen(!isMobileLabelMenuOpen)}
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
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-6 right-6 mt-2 bg-white border shadow-2xl z-50 overflow-hidden rounded-2xl"
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
                              onClick={() => handleLabelChange(label.id)}
                              className={`w-full flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl ${selectedLabel === label.id ? 'text-primary bg-primary/5' : 'text-secondary'}`}
                            >
                              {label.name}
                              {selectedLabel === label.id && <Check className="w-3 h-3" />}
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
                    onClick={() => handleLabelChange(label.id)}
                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.25em] border rounded-full transition-all ${selectedLabel === label.id ? 'bg-secondary border-secondary text-white' : 'border-secondary/10 hover:border-secondary'}`}
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
              {allProducts.map((product: Product, index: number) => (
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
