import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product, Subcategory } from '@/types';

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subQuery = searchParams.get('sub')?.toLowerCase();
  const [selectedSub, setSelectedSub] = useState<number | null>(subQuery ? parseInt(subQuery) : null);
  const [page, setPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const subId = subQuery ? parseInt(subQuery) : null;
    if (subId !== selectedSub) {
      setSelectedSub(subId);
    }
  }, [subQuery, selectedSub]);

  const handleSubChange = (subId: number | null) => {
    setSelectedSub(subId);
    if (subId) {
      setSearchParams({ sub: subId.toString() });
    } else {
      setSearchParams({});
    }
    setIsMobileMenuOpen(false);
  };
  const pageSize = 12;
  const [allProducts, setAllProducts] = useState<Product[]>([]);

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

  const { data: products, isLoading, isFetching } = useQuery<Product[]>({
    queryKey: ['products', categoryId, selectedSub, page],
    queryFn: () => {
      return api.products.getAll(categoryId?.toString(), selectedSub?.toString(), page, pageSize, true);
    },
    enabled: !!categoryId
  });

  const prevCategory = React.useRef(category);
  const prevSub = React.useRef(selectedSub);

  React.useEffect(() => {
    if (prevCategory.current !== category || prevSub.current !== selectedSub) {
      setPage(1);
      setAllProducts([]);
      prevCategory.current = category;
      prevSub.current = selectedSub;
    }
  }, [category, selectedSub]);

  React.useEffect(() => {
    if (products) {
      if (page === 1) {
        setAllProducts(products);
      } else {
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p.product_id));
          const newProducts = products.filter(p => !existingIds.has(p.product_id));
          return [...prev, ...newProducts];
        });
      }
    }
  }, [products, page]);

  const hasMore = products?.length === pageSize;

  return (
    <div className="bg-accent min-h-screen pt-12 pb-32 text-secondary">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <header className="mb-20 text-center">
          <h1 className="text-[10vw] font-black tracking-tighter uppercase italic mb-6 leading-none">
            {category}
          </h1>
          
          {subcategories && subcategories.length > 0 && (
            <div className="mt-12">
              {/* Mobile View: Custom Premium Dropdown */}
              <div className="block md:hidden px-6 relative z-30">
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
                        className="absolute left-6 right-6 mt-2 bg-white border border-gray-100 shadow-2xl z-40 overflow-hidden rounded-2xl"
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

              {/* Desktop View: Button Group */}
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
        </header>

        {isLoading && page === 1 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
             {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-3/4 bg-white/5 animate-pulse rounded-3xl" />)}
           </div>
        ) : allProducts.length === 0 ? (
          <div className="py-40 text-center">
            <p className="text-gray-500 uppercase tracking-[0.3em] font-bold">No hay artículos disponibles en esta categoría actualmente.</p>
          </div>
        ) : (
          <div className="space-y-20">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${categoryId}-${selectedSub}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="columns-1 sm:columns-2 lg:columns-4 gap-x-10 gap-y-20"
              >
                {allProducts.map((product: Product) => (
                  <div key={`${product.product_id}-${product.name}`} className="break-inside-avoid mb-20">
                    <ProductCard product={product} />
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {hasMore && (
              <div className="flex justify-center pt-12">
                <button 
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={isFetching}
                  className="px-12 py-4 bg-transparent border-2 border-secondary text-secondary text-[10px] font-black uppercase tracking-[0.3em] hover:bg-secondary hover:text-white transition-all disabled:opacity-50"
                >
                  {isFetching ? 'Cargando...' : 'Ver más artículos'}
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
