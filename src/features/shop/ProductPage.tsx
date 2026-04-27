import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Share2, Heart, ShoppingBag } from 'lucide-react';
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductVariant } from '@/types';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImage, setActiveImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user, isAuthenticated, setPendingFavorite } = useAuthStore();
  const { addItem, openModal } = useCartStore();

  const isFavorite = user?.favorites?.includes(id || '') || false;

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      setPendingFavorite(id || null);
      openModal({
        title: 'Inicia sesión',
        message: 'Inicia sesión para guardar tus favoritos y acceder a ellos desde cualquier dispositivo.',
        type: 'info'
      });
      return;
    }

    const currentFavorites = user?.favorites || [];
    const isFav = currentFavorites.includes(id || '');
    const newFavorites = isFav 
      ? currentFavorites.filter(favId => favId !== id)
      : [...currentFavorites, id || ''];

    try {
      await api.customers.update(user!.customer_id, { favorites: newFavorites });
      useAuthStore.getState().updateUser({ favorites: newFavorites });
      
      if (!isFav) {
        openModal({
          title: 'Añadido a favoritos',
          message: 'El artículo se ha guardado en tu lista de deseos.',
          type: 'favorites'
        });
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.products.getById(id!),
    enabled: !!id
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center animate-pulse text-primary font-black uppercase tracking-widest">Cargando Pieza...</div>;
  if (!product || product.is_published === false) return <div className="h-screen flex items-center justify-center">Producto no encontrado</div>;

  return (
    <div className="bg-accent min-h-screen pt-12 pb-32 text-secondary">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center flex-wrap gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-secondary/40 mb-12">
          <Link to="/" className="hover:text-secondary transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/categoria/${product.category.toLowerCase()}`} className="hover:text-secondary transition-colors">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          {product.subcategory && (
            <>
              <Link 
                to={`/categoria/${product.category.toLowerCase()}?sub=${product.subcategory_id}`} 
                className="hover:text-secondary transition-colors"
              >
                {product.subcategory}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-primary">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-6">
            <div className="col-span-2 space-y-4">
              {product.images.map((img: string, idx: number) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-[3/4] cursor-pointer overflow-hidden border ${activeImage === idx ? 'border-primary' : 'border-transparent opacity-50'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
             <div className="col-span-10 relative aspect-[3/4] overflow-hidden bg-black/20">
               {!imageLoaded && (
                 <div className="absolute inset-0 animate-pulse bg-secondary/10" />
               )}
               <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={product.images[activeImage]} 
                  alt={product.name} 
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="eager"
                  fetchPriority="high"
                />
               </AnimatePresence>
            </div>
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="mb-12 border-b border-secondary/5 pb-12">
              <span className="text-primary font-black tracking-[0.4em] uppercase text-xs mb-4 block">{product.category}</span>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tighter uppercase italic mb-6 leading-none">{product.name}</h1>
              <p className="text-3xl font-light text-secondary">
                {product.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>

            <div className="space-y-12">
              <div>
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Seleccionar Talla</h4>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {product.variants.map((v: ProductVariant) => {
                    const isOutOfStock = v.stock <= 0;
                    return (
                      <button
                        key={v.id}
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(v.size)}
                        className={`py-4 text-xs font-black tracking-widest transition-all border relative overflow-hidden
                          ${selectedSize === v.size 
                            ? 'bg-secondary text-white border-secondary shadow-xl' 
                            : isOutOfStock 
                              ? 'opacity-40 cursor-not-allowed border-secondary/5 text-secondary/40 grayscale' 
                              : 'bg-transparent text-secondary border-secondary/10 hover:border-secondary'
                          }`}
                      >
                        {v.size}
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[120%] h-[1px] bg-secondary/30 rotate-[-45deg]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="flex-1 py-6 text-base font-black tracking-widest uppercase italic bg-primary hover:bg-primary-dark text-white shadow-xl shadow-primary/20"
                  onClick={() => {
                    if (!selectedSize) {
                      openModal({
                        title: 'Selecciona tu talla',
                        message: 'Por favor, elige una talla antes de añadir el artículo a la cesta.',
                        type: 'warning'
                      });
                      return;
                    }
                    const variant = product.variants.find((v: ProductVariant) => v.size === selectedSize)!;
                    addItem(product, variant);
                  }}
                >
                  <ShoppingBag className="mr-2 w-5 h-5" /> Añadir a la Cesta
                </Button>
                <button 
                  onClick={toggleFavorite}
                  className={`p-6 border border-secondary/10 transition-all group rounded-xl ${isFavorite ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'hover:bg-secondary hover:text-white'}`}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : 'group-hover:fill-current'}`} />
                </button>
              </div>

              <div className="pt-12 border-t border-secondary/5">
                <button 
                  onClick={() => {
                    const shareData = {
                      title: product.name,
                      text: `Mira esta pieza de Modas Me lo Merezco: ${product.name}`,
                      url: window.location.href,
                    };

                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {
                        navigator.clipboard.writeText(window.location.href);
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      openModal({
                        title: 'Enlace copiado',
                        message: 'El enlace del producto se ha copiado al portapapeles.',
                        type: 'info'
                      });
                    }
                  }}
                  className="w-full flex items-center justify-center gap-4 py-5 border border-secondary/10 hover:border-secondary hover:bg-secondary/5 transition-all group rounded-2xl"
                >
                  <Share2 className="w-5 h-5 text-secondary/40 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/40 group-hover:text-secondary transition-colors">Compartir esta pieza</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
