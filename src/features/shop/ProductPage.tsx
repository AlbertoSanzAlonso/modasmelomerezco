import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Share2, Heart, ShoppingBag, X } from 'lucide-react';
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCT_PLACEHOLDER } from '@/lib/constants';
import type { ProductVariant } from '@/types';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImage, setActiveImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-center the image when zooming in
  useEffect(() => {
    if (showFullscreen && scrollRef.current) {
      const container = scrollRef.current;
      // Small timeout to wait for image resize/render
      setTimeout(() => {
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
      }, 50);
    }
  }, [showFullscreen, isZoomed]);

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

  if (isLoading) return (
    <div className="h-screen bg-accent flex flex-col items-center justify-center gap-8">
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
        <img src="/logo-corona.png" alt="Cargando..." className="w-16 h-16 object-contain" />
        <motion.div 
          animate={{ scale: [1, 2, 1], opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
          className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
        />
      </motion.div>
    </div>
  );
  if (!product || product.is_published === false) return <div className="h-screen flex items-center justify-center">Producto no encontrado</div>;

  const displayImages = product.images.length > 0 ? product.images : [PRODUCT_PLACEHOLDER];

  return (
    <div className="bg-accent min-h-screen pt-12 pb-32 text-secondary">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center flex-wrap gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-secondary/40 mb-12">
          <Link to="/" className="hover:text-secondary transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/categoria/${product.category?.toLowerCase() || 'todas'}`} className="hover:text-secondary transition-colors">{product.category || 'Sin Categoría'}</Link>
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
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div 
              className="relative aspect-3/4 overflow-hidden bg-black/20 cursor-pointer"
              onClick={() => setShowFullscreen(true)}
            >
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
                  src={displayImages[activeImage]} 
                  alt={product.name} 
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="eager"
                  fetchPriority="high"
                />
              </AnimatePresence>
              
              {imageLoaded && (
                <div className="absolute bottom-4 right-4 w-1/6 max-w-[120px] pointer-events-none opacity-60 select-none z-10">
                  <img 
                    src="/LOGO%20MELOMEREZCO%20corona%20blanco.png" 
                    alt="" 
                    className="w-full h-auto drop-shadow-lg" 
                  />
                </div>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {displayImages.map((img: string, idx: number) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`shrink-0 w-20 h-24 cursor-pointer overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-6 flex flex-col justify-center">
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
                            <div className="w-[120%] h-px bg-secondary/30 -rotate-45" />
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

      {/* Fullscreen Image Modal */}
      {showFullscreen && (
        <div 
          ref={scrollRef}
          className="fixed inset-0 z-[100] bg-black/95 overflow-auto cursor-default"
          onClick={() => { setShowFullscreen(false); setIsZoomed(false); }}
        >
          {/* Close Button */}
          <button 
            onClick={() => { setShowFullscreen(false); setIsZoomed(false); }}
            className="fixed top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[120]"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows (Desktop) */}
          {!isZoomed && product.images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev === 0 ? product.images.length - 1 : prev - 1); }}
                className="fixed left-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-[110]"
              >
                <ChevronRight className="w-8 h-8 rotate-180" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev === product.images.length - 1 ? 0 : prev + 1); }}
                className="fixed right-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-[110]"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Flying Arrow Indicator (Hint) */}
          <AnimatePresence>
            {!isZoomed && product.images.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: [0, 1, 0], x: [0, 40, 60] }}
                transition={{ duration: 2, repeat: 2, repeatDelay: 1 }}
                className="fixed right-12 top-1/2 -translate-y-1/2 pointer-events-none z-[115] flex items-center gap-2 text-white/40"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Desliza</span>
                <ChevronRight className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            className={`min-h-full min-w-full flex items-center justify-center ${isZoomed ? 'w-[300vw] h-[300vh]' : ''}`}
          >
            <div 
              className={`relative ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={displayImages[activeImage]} 
                  alt={product.name}
                  className={`transition-all duration-500 shadow-2xl rounded-sm ${isZoomed ? 'max-w-none w-[180vw] md:w-[120vw]' : 'max-w-[90vw] max-h-[85vh] object-contain'}`}
                />
              </AnimatePresence>
              {/* Watermark */}
              <div className={`absolute pointer-events-none opacity-40 select-none transition-none ${isZoomed ? 'bottom-32 right-16 w-32 md:w-48' : 'bottom-6 right-6 w-20 md:w-32'}`}>
                <img src="/LOGO%20MELOMEREZCO%20corona%20blanco.png" alt="" className="w-full h-auto" />
              </div>
            </div>
          </div>

          {/* Thumbnails row */}
          {!isZoomed && product.images.length > 1 && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-4 bg-black/40 backdrop-blur-md rounded-2xl z-[120]">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                  className={`w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPage;
