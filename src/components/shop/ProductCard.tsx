
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import type { Product } from "@/types/index";
import { ProductImage } from "./ProductImage";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user, isAuthenticated, updateUser, setPendingFavorite } = useAuthStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const isFavorite = user?.favorites?.includes(String(product.product_id)) || false;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setPendingFavorite(product.product_id);
      navigate('/login');
      return;
    }

    if (!user) return;

    const currentFavorites = user.favorites || [];
    const newFavorites = isFavorite
      ? currentFavorites.filter(id => id !== product.product_id)
      : [...currentFavorites, product.product_id];

    // Optimistic update
    updateUser({ favorites: newFavorites });

    if (!isFavorite) {
      // Show success modal only when adding
      import("@/store/useCartStore").then(m => {
        m.useCartStore.getState().openModal({
          title: 'Añadido a favoritos',
          message: `El artículo ${product.name} se ha guardado en tu lista personal.`,
          type: 'favorites'
        });
      });
    }

    try {
      if (isFavorite) {
        await api.favorites.remove(user.customer_id, product.product_id);
        queryClient.invalidateQueries({ queryKey: ['favorites', user.customer_id] });
      } else {
        await api.favorites.add(user.customer_id, product.product_id);
        queryClient.invalidateQueries({ queryKey: ['favorites', user.customer_id] });
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      updateUser({ favorites: currentFavorites });
    }
  };

  return (
    <div className="group relative flex flex-col bg-transparent">
      <Link to={`/producto/${product.product_id}`}>
        <ProductImage 
          src={product.images?.[0]} 
          alt={product.name} 
          onLoad={() => setIsLoaded(true)}
          containerClassName="rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-500"
        />
      </Link>
        
      {/* UI Elements - Only visible when image is loaded */}
      <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 md:top-4 md:right-4 p-2 md:p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
            isFavorite 
              ? 'bg-primary text-white scale-110 shadow-lg' 
              : 'bg-white/10 text-white hover:bg-white/20 hover:scale-110'
          }`}
        >
          <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {((product as any).is_new || (product as any).featured) && (
          <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-primary text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 uppercase tracking-widest italic">
            Novedad
          </span>
        )}

        <div className="mt-3 md:mt-6 flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xs md:text-sm font-bold tracking-tight text-secondary uppercase italic">
              {product.name}
            </h3>
            <p className="text-[10px] text-secondary/40 mt-1 uppercase tracking-widest">
              {product.category}
            </p>
          </div>
          <p className="text-xs md:text-sm font-black text-secondary italic">
            {product.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>
    </div>
  );
};
