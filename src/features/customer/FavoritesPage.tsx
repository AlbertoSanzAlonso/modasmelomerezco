import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from "@/store/useAuthStore";
import type { Product } from '@/types';
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";

export const FavoritesPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const customerId = user?.customer_id || '';
  
  const { data: favoriteProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['favorites', customerId],
    queryFn: () => api.favorites.getByCustomer(customerId),
    enabled: !!customerId,
  });
  
  // Sync store favorites with DB when page loads
  useEffect(() => {
    if (customerId && favoriteProducts.length > 0) {
      const dbFavorites = favoriteProducts.map(p => String(p.product_id));
      const storeFavorites = user?.favorites || [];
      if (JSON.stringify(storeFavorites) !== JSON.stringify(dbFavorites)) {
        updateUser({ favorites: dbFavorites });
      }
    }
  }, [customerId, favoriteProducts, updateUser, user?.favorites]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-display font-black uppercase tracking-tighter mb-2">
          Mis <span className="italic font-serif lowercase text-primary">favoritos</span>
        </h1>
        <p className="text-gray-500 font-medium">
          Los artículos que has marcado con el corazón.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !favoriteProducts || favoriteProducts.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-widest italic mb-2">
            Sin favoritos aún
          </h3>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Cuando marques un artículo con el corazón, aparecerá aquí para que puedas verlo fácilmente.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white font-black uppercase italic tracking-widest text-xs rounded-xl hover:bg-white hover:text-black transition-all"
          >
            Explorar Productos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {favoriteProducts.filter(p => p.is_published).map((product: any) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};