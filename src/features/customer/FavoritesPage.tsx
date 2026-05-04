import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from "@/store/useAuthStore";
import type { Product } from '@/types';
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import { motion } from 'framer-motion';

export const FavoritesPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const customerId = user?.customer_id || '';
  
  const { data: favoriteProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['favorites', customerId],
    queryFn: () => api.favorites.getByCustomer(customerId),
    enabled: !!customerId,
  });
  
  useEffect(() => {
    if (customerId && !isLoading) {
      const dbFavorites = favoriteProducts
        .filter(p => p.is_published)
        .map(p => String(p.product_id));
        
      const storeFavorites = user?.favorites || [];
      const sortedStore = [...storeFavorites].sort();
      const sortedDb = [...dbFavorites].sort();
      
      if (JSON.stringify(sortedStore) !== JSON.stringify(sortedDb)) {
        updateUser({ favorites: dbFavorites });
      }
    }
  }, [customerId, favoriteProducts, isLoading, updateUser, user?.favorites]);

  return (
    <div className="space-y-16 py-10">
      <header className="text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 italic leading-none">
            Mis <span className="text-primary not-italic font-light opacity-50">favoritos</span>
          </h1>
          <div className="w-12 h-1 bg-primary mx-auto mb-6" />
          <p className="text-secondary/40 text-xs font-bold uppercase tracking-[0.3em]">
            Tu selección personal de piezas exclusivas
          </p>
        </motion.div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/30">Cargando tu colección...</p>
        </div>
      ) : !favoriteProducts || favoriteProducts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 bg-white/5 border border-secondary/5 rounded-[40px] px-8"
        >
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/5 flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary/20" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-widest italic mb-4">
            Tu lista está vacía
          </h3>
          <p className="text-secondary/40 text-sm mb-12 max-w-sm mx-auto leading-relaxed">
            Parece que aún no has encontrado tu pieza ideal. Explora nuestra nueva colección y guarda lo que más te guste.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-4 px-10 py-5 bg-secondary text-white font-black uppercase italic tracking-[0.2em] text-[10px] rounded-full hover:bg-primary transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            Explorar Colección
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16"
        >
          {favoriteProducts.filter(p => p.is_published).map((product: any) => (
            <motion.div
              key={product.product_id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};