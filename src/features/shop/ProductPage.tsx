import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Share2, Heart, ShoppingBag, X } from 'lucide-react';
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCT_PLACEHOLDER } from '@/lib/constants';
import type { ProductVariant, Color } from '@/types';
import {
  getUniqueSizes,
  hasStockForSize,
  hasStockForColor,
  findVariant,
  hasColorVariants,
  normalizeSize,
} from '@/lib/productVariants';
import { SeoHelmet } from '@/components/seo/SeoHelmet';
import {
  absoluteUrl,
  truncateDescription,
  OFFER_SHIPPING_DETAILS,
  MERCHANT_RETURN_POLICY,
} from '@/lib/seo/constants';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeMobileColorTooltip, setActiveMobileColorTooltip] = useState<string>('');
  const tooltipTimeoutRef = useRef<any>(null);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none)').matches);
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleSizeSelect = (size: string, variants = product?.variants) => {
    setSelectedSize(size);
    if (selectedColorId != null && variants) {
      const stillAvailable = hasStockForColor(variants, size, selectedColorId);
      if (!stillAvailable) setSelectedColorId(null);
    }
  };

  const handleColorSelect = (colorId: number, colorName: string) => {
    setSelectedColorId(colorId);
    if (isTouchDevice) {
      setActiveMobileColorTooltip(colorName);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = setTimeout(() => {
        setActiveMobileColorTooltip('');
      }, 2500);
    }
  };
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
      if (isFav) {
        await api.favorites.remove(user!.customer_id, id!);
      } else {
        await api.favorites.add(user!.customer_id, id!);
      }
      
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

  const { data: siblings } = useQuery({
    queryKey: ['product-siblings', id, product?.category_id, product?.subcategory_id],
    queryFn: () => api.products.getSiblings(id!, product?.category_id?.toString(), product?.subcategory_id?.toString()),
    enabled: !!product
  });

  useEffect(() => {
    setSelectedSize('');
    setSelectedColorId(null);
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const sizeParam = searchParams.get('talla')?.trim();
    const colorParam = searchParams.get('color')?.trim();
    if (!sizeParam && !colorParam) return;

    const sizes = getUniqueSizes(product.variants);

    let nextSize = '';
    let nextColorId: number | null = null;

    const sizeParamNorm = normalizeSize(sizeParam);
    if (sizeParamNorm && sizes.includes(sizeParamNorm)) {
      nextSize = sizeParamNorm;
    }

    if (colorParam && nextSize) {
      const colorId = Number(colorParam);
      if (Number.isInteger(colorId) && hasStockForColor(product.variants, nextSize, colorId)) {
        nextColorId = colorId;
      }
    }

    if (nextSize) setSelectedSize(nextSize);
    if (nextColorId != null) setSelectedColorId(nextColorId);
  }, [product, searchParams]);

  // Save the last viewed product ID for scroll restoration
  useEffect(() => {
    if (product) {
      const categoryKey = product.category?.toLowerCase() || 'todas';
      const subKey = product.subcategory_id?.toString() || 'null';
      const key = `category-${categoryKey}-${subKey}`;
      sessionStorage.setItem(`lastId-${key}`, product.product_id);
    }
  }, [product]);

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
        <img src="/assets/logo/logo-corona.png" alt="Cargando..." className="w-16 h-16 object-contain" />
        <motion.div 
          animate={{ scale: [1, 2, 1], opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
          className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
        />
      </motion.div>
    </div>
  );
  if (!product || product.is_published === false) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <SeoHelmet
          title="Producto no encontrado"
          description="El producto que buscas no está disponible en Modas Me lo Merezco."
          path={`/producto/${id}`}
          noindex
        />
        <p>Producto no encontrado</p>
      </div>
    );
  }

  const displayImages = product.images.length > 0 ? product.images : [PRODUCT_PLACEHOLDER];
  const availableSizes = getUniqueSizes(product.variants);
  const catalogColors = product.colors || [];
  const requiresColor = hasColorVariants(product.variants);
  const productDescription = truncateDescription(
    product.description ||
      `${product.name}. Precio ${product.price.toFixed(2)} €. Compra online en Modas Me lo Merezco.`,
  );

  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
  const availabilitySchema = totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  return (
    <div className="bg-accent min-h-screen pt-12 pb-32 text-secondary">
      <SeoHelmet
        title={product.name}
        description={productDescription}
        path={`/producto/${product.product_id}`}
        image={displayImages[0]}
        type="product"
        jsonLd={[
          {
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
                name: product.category || 'Sin Categoría',
                item: absoluteUrl(`/categoria/${product.category?.toLowerCase() || 'todas'}`),
              },
              ...(product.subcategory
                ? [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: product.subcategory,
                      item: absoluteUrl(
                        `/categoria/${product.category?.toLowerCase() || 'todas'}?sub=${product.subcategory_id}`,
                      ),
                    },
                    {
                      '@type': 'ListItem',
                      position: 4,
                      name: product.name,
                      item: absoluteUrl(`/producto/${product.product_id}`),
                    },
                  ]
                : [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: product.name,
                      item: absoluteUrl(`/producto/${product.product_id}`),
                    },
                  ]),
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: productDescription,
            image: displayImages[0]?.startsWith('http')
              ? displayImages[0]
              : absoluteUrl(displayImages[0]),
            brand: {
              '@type': 'Brand',
              name: 'Modas Me lo Merezco',
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'EUR',
              price: product.price,
              availability: availabilitySchema,
              url: absoluteUrl(`/producto/${product.product_id}`),
              shippingDetails: OFFER_SHIPPING_DETAILS,
              hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
            },
          },
        ]}
      />
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center justify-between mb-12">
          <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-secondary/40">
            <Link to="/" state={{ fromProduct: true }} className="hover:text-secondary transition-colors">Inicio</Link>
            <ChevronRight className="w-3 h-3" />
            <Link 
              to={`/categoria/${product.category?.toLowerCase() || 'todas'}`} 
              state={{ fromProduct: true }}
              className="hover:text-secondary transition-colors"
            >
              {product.category || 'Sin Categoría'}
            </Link>
            <ChevronRight className="w-3 h-3" />
            {product.subcategory && (
              <>
                <Link 
                  to={`/categoria/${product.category.toLowerCase()}?sub=${product.subcategory_id}`} 
                  state={{ fromProduct: true }}
                  className="hover:text-secondary transition-colors"
                >
                  {product.subcategory}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-primary">{product.name}</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 border-r border-secondary/10 pr-4 sm:pr-8">
              <Link 
                to={siblings?.prevId ? `/producto/${siblings.prevId}` : '#'}
                replace={true}
                className={`p-2 transition-all ${!siblings?.prevId ? 'opacity-20 cursor-not-allowed' : 'hover:text-primary hover:bg-primary/5 rounded-full'}`}
                title="Producto Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <Link 
                to={siblings?.nextId ? `/producto/${siblings.nextId}` : '#'}
                replace={true}
                className={`p-2 transition-all ${!siblings?.nextId ? 'opacity-20 cursor-not-allowed' : 'hover:text-primary hover:bg-primary/5 rounded-full'}`}
                title="Siguiente Producto"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-secondary/60 hover:text-primary transition-all group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Volver a la lista</span>
              <span className="sm:hidden">Volver</span>
            </button>
          </div>
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
                  onError={() => {
                    console.error("Error loading image in ProductPage");
                    setImageLoaded(true); // Still set to true to show the broken image icon or placeholder
                  }}
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
                  <img src={img} alt="" loading="lazy" width={80} height={96} className="w-full h-full object-cover" />
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
                  {availableSizes.map((size) => {
                    const isOutOfStock = !hasStockForSize(product.variants, size);
                    return (
                      <button
                        key={size}
                        disabled={isOutOfStock}
                        onClick={() => handleSizeSelect(size)}
                        className={`py-4 text-xs font-black tracking-widest transition-all border relative overflow-hidden
                          ${selectedSize === size 
                            ? 'bg-secondary text-white border-secondary shadow-xl' 
                            : isOutOfStock 
                              ? 'opacity-40 cursor-not-allowed border-secondary/5 text-secondary/40 grayscale' 
                              : 'bg-transparent text-secondary border-secondary/10 hover:border-secondary'
                          }`}
                      >
                        {normalizeSize(size)}
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

              {requiresColor && (
                <div>
                  <div className="mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Seleccionar Color</h4>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {catalogColors.map((c: Color) => {
                      const colorOutOfStock =
                        !!selectedSize &&
                        !hasStockForColor(product.variants, selectedSize, c.id);
                      const colorDisabled = !selectedSize || colorOutOfStock;
                      return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={colorDisabled}
                        onClick={() => !colorDisabled && handleColorSelect(c.id, c.name)}
                        className={`relative group transition-all ${colorDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={c.name}
                      >
                        {/* Outer selected ring */}
                        <div className={`absolute inset-0 -m-1.5 rounded-full border-2 transition-all duration-300
                          ${selectedColorId === c.id 
                            ? 'border-primary scale-100 opacity-100' 
                            : 'border-transparent scale-75 opacity-0 group-hover:border-secondary/30 group-hover:scale-100 group-hover:opacity-100'
                          }`}
                        />
                        {/* Inner color swatch */}
                        <div 
                          className="w-10 h-10 rounded-full border border-black/10 shadow-md relative overflow-hidden transition-all duration-300 group-hover:scale-105 active:scale-95"
                          style={{ backgroundColor: c.hex }}
                        />
                        
                        {/* Tooltip */}
                        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-secondary text-white text-[9px] font-bold uppercase tracking-wider rounded-lg pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg z-10
                          ${(isTouchDevice && activeMobileColorTooltip === c.name) 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {c.name}
                        </span>
                      </button>
                    );
                    })}
                  </div>
                  {!selectedSize && (
                    <p className="text-[9px] text-secondary/40 font-bold uppercase tracking-widest mt-4">
                      Elige una talla para ver los colores disponibles
                    </p>
                  )}
                </div>
              )}

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
                    if (requiresColor && selectedColorId == null) {
                      openModal({
                        title: 'Selecciona tu color',
                        message: 'Por favor, elige un color antes de añadir el artículo a la cesta.',
                        type: 'warning'
                      });
                      return;
                    }
                    const variant = findVariant(product.variants, selectedSize, {
                      colorId: requiresColor ? selectedColorId! : undefined,
                    });
                    if (!variant || variant.stock <= 0) {
                      openModal({
                        title: 'Sin stock',
                        message: 'Esta combinación de talla y color no está disponible.',
                        type: 'warning'
                      });
                      return;
                    }
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
          className="fixed inset-0 z-100 bg-black/95 overflow-auto cursor-default"
          onClick={() => { setShowFullscreen(false); setIsZoomed(false); }}
        >
          {/* Close Button */}
          <button 
            onClick={() => { setShowFullscreen(false); setIsZoomed(false); }}
            className="fixed top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-120"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows (Desktop) */}
          {!isZoomed && product.images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev === 0 ? product.images.length - 1 : prev - 1); }}
                className="fixed left-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-110"
              >
                <ChevronRight className="w-8 h-8 rotate-180" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev === product.images.length - 1 ? 0 : prev + 1); }}
                className="fixed right-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-110"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}


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
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-4 bg-black/40 backdrop-blur-md rounded-2xl z-120">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                  className={`w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img src={img} alt="" loading="lazy" width={48} height={64} className="w-full h-full object-cover" />
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
