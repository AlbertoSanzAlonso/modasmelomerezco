import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/shop/ProductCard';
import type { Product } from '@/types';
import { SeoHelmet } from '@/components/seo/SeoHelmet';

const PAGE_SIZE = 12;

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [query]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search-products', query, page],
    queryFn: () =>
      api.products.getAll(undefined, undefined, page, PAGE_SIZE, true, query),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!data?.products) return;
    setAllProducts((prev) => {
      if (page === 1) return data.products;
      const existing = new Set(prev.map((p) => p.product_id));
      const next = data.products.filter((p) => !existing.has(p.product_id));
      return next.length > 0 ? [...prev, ...next] : prev;
    });
  }, [data?.products, page]);

  const hasMore = data ? allProducts.length < data.total : false;
  const showEmpty =
    !isLoading && !isFetching && query.length > 0 && allProducts.length === 0;

  return (
    <div className="bg-accent min-h-screen pt-12 pb-32 text-secondary">
      <SeoHelmet
        title={query ? `Buscar: ${query}` : 'Buscar'}
        description={
          query
            ? `Resultados de búsqueda para «${query}» en Modas Me lo Merezco.`
            : 'Busca piezas en Modas Me lo Merezco.'
        }
        path="/buscar"
        noindex
      />

      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4 leading-none">
            Buscar
          </h1>
          {query ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/50">
              Resultados para «{query}»
              {data?.total != null ? ` · ${data.total} pieza${data.total === 1 ? '' : 's'}` : ''}
            </p>
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/50">
              Escribe en el buscador para encontrar piezas
            </p>
          )}
        </header>

        {!query ? null : isLoading && page === 1 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-3/4 bg-white/5 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : showEmpty ? (
          <div className="py-32 text-center">
            <p className="text-gray-500 uppercase tracking-[0.3em] font-bold">
              No encontramos piezas con ese término.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {allProducts.map((product, index) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (index % PAGE_SIZE) * 0.04 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] border border-secondary/20 hover:border-primary hover:text-primary transition-colors rounded-full disabled:opacity-50"
                >
                  {isFetching ? 'Cargando…' : 'Ver más'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
