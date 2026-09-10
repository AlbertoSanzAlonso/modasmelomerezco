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
  isOneSizeOnlyProduct,
  getOneSizeForProduct,
  isProductSoldOut,
  getColorDisplayName,
  findImageIndexForColor,
} from '@/lib/productVariants';
import { getProductPath, isProductUuid } from '@/lib/productSlug';
import { SeoHelmet } from '@/components/seo/SeoHelmet';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
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
  const galleryTouchStartX = useRef<number | null>(null);
  const galleryDidSwipe = useRef(false);

  const changeActiveImage = (next: number | ((prev: number) => number)) => {
    setImageLoaded(false);
    setActiveImage(next);
  };

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

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.products.getBySlugOrId(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const productId = product?.product_id;
  const isFavorite = !!(productId && user?.favorites?.includes(productId));

  const toggleFavorite = async () => {
    if (!productId) return;

    if (!isAuthenticated) {
      setPendingFavorite(productId);
      openModal({
        title: 'Inicia sesión',
        message: 'Inicia sesión para guardar tus favoritos y acceder a ellos desde cualquier dispositivo.',
        type: 'info'
      });
      return;
    }

    const currentFavorites = user?.favorites || [];
    const isFav = currentFavorites.includes(productId);
    const newFavorites = isFav
      ? currentFavorites.filter((favId) => favId !== productId)
      : [...currentFavorites, productId];

    try {
      if (isFav) {
        await api.favorites.remove(user!.customer_id, productId);
      } else {
        await api.favorites.add(user!.customer_id, productId);
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

  const { data: siblings } = useQuery({
    queryKey: ['product-siblings', productId, product?.category_id, product?.subcategory_id],
    queryFn: () =>
      api.products.getSiblings(
        productId!,
        product?.category_id?.toString(),
        product?.subcategory_id?.toString(),
      ),
    enabled: !!product && !!productId,
  });

  // Redirect UUID URLs antiguas → slug canónico (preserva query talla/color)
  useEffect(() => {
    if (!product?.slug || !id) return;
    if (!isProductUuid(id)) return;
    if (id === product.slug) return;
    const search = searchParams.toString();
    navigate(`${getProductPath(product)}${search ? `?${search}` : ''}`, { replace: true });
  }, [product, id, navigate, searchParams]);

  useEffect(() => {
    setSelectedSize('');
    setSelectedColorId(null);
    changeActiveImage(0);
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const implicitSize = getOneSizeForProduct(product.variants);
    const sizeParam = searchParams.get('talla')?.trim();
    const colorParam = searchParams.get('color')?.trim();
    if (!sizeParam && !colorParam && !implicitSize) return;

    const sizes = getUniqueSizes(product.variants);

    let nextSize = implicitSize ?? '';
    let nextColorId: number | null = null;

    const sizeParamNorm = normalizeSize(sizeParam);
    if (sizeParamNorm && sizes.some((s) => normalizeSize(s) === sizeParamNorm)) {
      nextSize = sizes.find((s) => normalizeSize(s) === sizeParamNorm) ?? nextSize;
    }

    const sizeForColor = nextSize || implicitSize || '';
    if (colorParam && sizeForColor) {
      const colorId = Number(colorParam);
      if (Number.isInteger(colorId) && hasStockForColor(product.variants, sizeForColor, colorId)) {
        nextColorId = colorId;
      }
    }

    if (nextSize) setSelectedSize(nextSize);
    if (nextColorId != null) setSelectedColorId(nextColorId);
  }, [product, searchParams]);

  // Al elegir un color, mostrar la foto asociada (si existe)
  useEffect(() => {
    if (selectedColorId == null) return;
    const imageIdx = findImageIndexForColor(product?.image_color_ids, selectedColorId);
    if (imageIdx < 0) return;
    changeActiveImage(imageIdx);
  }, [selectedColorId, product?.image_color_ids, product?.product_id]);

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
          path={id ? `/producto/${id}` : '/'}
          noindex
        />
        <p>Producto no encontrado</p>
      </div>
    );
  }

  const productPath = getProductPath(product);
  const displayImages = product.images.length > 0 ? product.images : [PRODUCT_PLACEHOLDER];
  const availableSizes = getUniqueSizes(product.variants);
  const oneSizeOnly = isOneSizeOnlyProduct(product.variants);
  const implicitSize = oneSizeOnly ? getOneSizeForProduct(product.variants) : null;
  const sizeForSelection = oneSizeOnly ? implicitSize : selectedSize;
  const catalogColors = product.colors || [];
  const requiresColor = hasColorVariants(product.variants);
  const productDescription = truncateDescription(
    product.description ||
      `${product.name}. Precio ${product.price.toFixed(2)} €. Compra online en Modas Me lo Merezco.`,
  );

  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
  const soldOut = isProductSoldOut(product);
  const availabilitySchema = totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  return (
    <div className="bg-accent min-h-screen pt-8 pb-32 text-secondary lg:pt-10 lg:pb-16">
      <SeoHelmet
        title={product.name}
        description={productDescription}
        path={productPath}
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
                      item: absoluteUrl(productPath),
                    },
                  ]
                : [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: product.name,
                      item: absoluteUrl(productPath),
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
              url: absoluteUrl(productPath),
              shippingDetails: OFFER_SHIPPING_DETAILS,
              hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
            },
          },
        ]}
      />
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center justify-between lg:mb-6">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-secondary/40">
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

          <div className="flex items-center gap-4 sm:gap-6 lg:gap-4">
            <div className="flex items-center gap-1 border-r border-secondary/10 pr-4 sm:gap-2 sm:pr-6 lg:pr-4">
              <Link 
                to={siblings?.prevSlug ? `/producto/${siblings.prevSlug}` : '#'}
                replace={true}
                className={`p-1.5 transition-all lg:p-1 ${!siblings?.prevSlug ? 'opacity-20 cursor-not-allowed' : 'hover:text-primary hover:bg-primary/5 rounded-full'}`}
                title="Producto Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <Link 
                to={siblings?.nextSlug ? `/producto/${siblings.nextSlug}` : '#'}
                replace={true}
                className={`p-1.5 transition-all lg:p-1 ${!siblings?.nextSlug ? 'opacity-20 cursor-not-allowed' : 'hover:text-primary hover:bg-primary/5 rounded-full'}`}
                title="Siguiente Producto"
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            <button 
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-[10px] font-black tracking-[0.3em] text-secondary/60 uppercase transition-all hover:text-primary"
            >
              <ChevronRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">Volver a la lista</span>
              <span className="sm:hidden">Volver</span>
            </button>
          </div>
        </nav>
        
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-16 xl:gap-20">
          {/* Left: Gallery */}
          <div className="flex flex-col gap-6 -mx-6 lg:col-span-5 lg:mx-0 lg:items-center lg:gap-3">
            <div 
              className="relative aspect-3/4 w-full cursor-pointer overflow-hidden bg-white touch-pan-y lg:max-w-[min(100%,440px)]"
              onClick={() => {
                if (galleryDidSwipe.current) {
                  galleryDidSwipe.current = false;
                  return;
                }
                setShowFullscreen(true);
              }}
              onTouchStart={(e) => {
                galleryTouchStartX.current = e.touches[0].clientX;
                galleryDidSwipe.current = false;
              }}
              onTouchMove={(e) => {
                if (galleryTouchStartX.current === null) return;
                if (Math.abs(e.touches[0].clientX - galleryTouchStartX.current) > 12) {
                  galleryDidSwipe.current = true;
                }
              }}
              onTouchEnd={(e) => {
                if (galleryTouchStartX.current === null || displayImages.length <= 1) {
                  galleryTouchStartX.current = null;
                  return;
                }
                const delta = e.changedTouches[0].clientX - galleryTouchStartX.current;
                const threshold = 40;
                if (Math.abs(delta) > threshold) {
                  galleryDidSwipe.current = true;
                  if (delta < 0) {
                    changeActiveImage((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
                  } else {
                    changeActiveImage((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
                  }
                }
                galleryTouchStartX.current = null;
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.img
                  src="/assets/logo/logo-corona.png"
                  alt=""
                  className="w-14 h-14 object-contain"
                  animate={{
                    scale: [1, 1.12, 1],
                    opacity: [0.12, 0.28, 0.12],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  src={displayImages[activeImage]} 
                  alt={product.name} 
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    console.error("Error loading image in ProductPage");
                    setImageLoaded(true);
                  }}
                  draggable={false}
                  className={`relative z-[1] h-full w-full object-cover object-top select-none ${soldOut ? 'grayscale-[0.25]' : ''}`}
                  loading="eager"
                  fetchPriority="high"
                />
              </AnimatePresence>

              {soldOut && imageLoaded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-black/40" />
                  <span className="relative px-8 py-3 bg-black/85 text-white text-sm sm:text-base font-black uppercase tracking-[0.4em] italic shadow-xl">
                    Agotado
                  </span>
                </div>
              )}
              
              {imageLoaded && (
                <div className="absolute bottom-4 right-4 w-1/6 max-w-[120px] pointer-events-none opacity-60 select-none z-10">
                  <img 
                    src="/LOGO%20MELOMEREZCO%20corona%20blanco.png" 
                    alt="" 
                    className="w-full h-auto drop-shadow-lg" 
                  />
                </div>
              )}

              {displayImages.length > 1 && (
                <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white">
                    {activeImage + 1}/{displayImages.length}
                  </span>
                </div>
              )}
            </div>
            <div className="hidden w-full max-w-[min(100%,440px)] gap-2 overflow-x-auto pb-1 lg:flex lg:justify-center">
              {displayImages.map((img: string, idx: number) => (
                <div 
                  key={idx}
                  onClick={() => changeActiveImage(idx)}
                  className={`h-16 w-14 shrink-0 cursor-pointer overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}
                >
                  <img src={img} alt="" loading="lazy" width={56} height={64} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex flex-col justify-center lg:col-span-7 lg:justify-start">
            <div className="mb-10 border-b border-secondary/5 pb-10 lg:mb-5 lg:pb-5">
              <span className="mb-3 block text-xs font-black tracking-[0.4em] text-primary uppercase lg:mb-2">{product.category}</span>
              <h1 className="mb-4 text-3xl leading-none font-black tracking-tighter uppercase italic sm:text-4xl lg:mb-3 lg:text-4xl xl:text-5xl">{product.name}</h1>
              <p className="text-3xl font-light text-secondary lg:text-2xl">
                {product.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>

            <div className="space-y-10 lg:space-y-5">
              {soldOut ? (
                <div className="space-y-6 lg:space-y-4">
                  <p className="text-sm font-bold tracking-widest text-secondary/60 uppercase">
                    Este artículo está agotado y no se puede comprar en este momento.
                  </p>
                  <Button
                    size="lg"
                    disabled
                    className="w-full cursor-not-allowed py-6 text-base font-black tracking-widest uppercase italic opacity-60 lg:py-3.5 lg:text-sm"
                  >
                    Agotado
                  </Button>
                </div>
              ) : (
              <>
              {oneSizeOnly ? (
                <div>
                  <div className="mb-4 lg:mb-2.5">
                    <h4 className="text-[10px] font-black tracking-[0.3em] uppercase">Talla</h4>
                  </div>
                  <div
                    className="inline-flex cursor-default border border-secondary/20 bg-secondary/10 px-8 py-4 text-xs font-black tracking-widest text-secondary uppercase select-none lg:px-6 lg:py-2.5"
                    aria-label="Talla única"
                  >
                    Talla única
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 lg:mb-2.5">
                    <h4 className="text-[10px] font-black tracking-[0.3em] uppercase">Seleccionar Talla</h4>
                  </div>
                  <div className="grid max-w-md grid-cols-4 gap-3 lg:gap-2">
                    {availableSizes.map((size) => {
                      const isOutOfStock = !hasStockForSize(product.variants, size);
                      return (
                        <button
                          key={size}
                          disabled={isOutOfStock}
                          onClick={() => handleSizeSelect(size)}
                          className={`relative overflow-hidden border py-4 text-xs font-black tracking-widest transition-all lg:py-2.5
                            ${selectedSize === size 
                              ? 'border-secondary bg-secondary text-white shadow-xl' 
                              : isOutOfStock 
                                ? 'cursor-not-allowed border-secondary/5 text-secondary/40 opacity-40 grayscale' 
                                : 'border-secondary/10 bg-transparent text-secondary hover:border-secondary'
                            }`}
                        >
                          {normalizeSize(size)}
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-px w-[120%] -rotate-45 bg-secondary/30" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {requiresColor && (
                <div>
                  <div className="mb-4 lg:mb-2.5">
                    <h4 className="text-[10px] font-black tracking-[0.3em] uppercase">Color</h4>
                  </div>
                  <div className="flex flex-wrap gap-4 lg:gap-3">
                    {catalogColors.map((c: Color) => {
                      const colorLabel = getColorDisplayName(c.name, product.name);
                      const colorOutOfStock =
                        !!sizeForSelection &&
                        !hasStockForColor(product.variants, sizeForSelection, c.id);
                      const colorDisabled = oneSizeOnly
                        ? colorOutOfStock
                        : !selectedSize || colorOutOfStock;
                      return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={colorDisabled}
                        onClick={() => !colorDisabled && handleColorSelect(Number(c.id), colorLabel)}
                        className={`relative group shrink-0 ${colorDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={colorLabel}
                      >
                        <ColorSwatch
                          color={{ ...c, name: colorLabel }}
                          className={`block size-10 overflow-hidden rounded-full shadow-md outline outline-2 outline-offset-2 transition-[transform,outline-color] duration-300 active:scale-95 lg:size-8 ${
                            selectedColorId === Number(c.id)
                              ? 'outline-primary'
                              : 'outline-transparent group-hover:outline-secondary/40'
                          } ${colorDisabled ? '' : 'group-hover:scale-105'}`}
                        />
                        {/* Tooltip */}
                        <span className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-secondary px-3 py-1.5 text-[9px] font-bold tracking-wider text-white uppercase whitespace-nowrap shadow-lg transition-opacity duration-200
                          ${(isTouchDevice && activeMobileColorTooltip === colorLabel) 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {colorLabel}
                        </span>
                      </button>
                    );
                    })}
                  </div>
                  {!oneSizeOnly && !selectedSize && (
                    <p className="mt-3 text-[9px] font-bold tracking-widest text-secondary/40 uppercase lg:mt-2">
                      Elige una talla para ver los colores disponibles
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 lg:gap-3">
                <Button 
                  size="lg" 
                  className="flex-1 bg-primary py-6 text-base font-black tracking-widest text-white uppercase italic shadow-xl shadow-primary/20 hover:bg-primary-dark lg:py-3.5 lg:text-sm"
                  onClick={() => {
                    if (!oneSizeOnly && !selectedSize) {
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
                    const cartSize = sizeForSelection ?? selectedSize;
                    const variant = findVariant(product.variants, cartSize, {
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
                  <ShoppingBag className="mr-2 h-5 w-5" /> Añadir a la Cesta
                </Button>
                <button 
                  onClick={toggleFavorite}
                  className={`rounded-xl border border-secondary/10 p-6 transition-all group lg:p-3.5 ${isFavorite ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-secondary hover:text-white'}`}
                >
                  <Heart className={`h-6 w-6 lg:h-5 lg:w-5 ${isFavorite ? 'fill-current' : 'group-hover:fill-current'}`} />
                </button>
              </div>
              </>
              )}

              {product.details?.trim() && (
                <div className="border-t border-secondary/5 pt-8 lg:pt-5">
                  <h4 className="mb-4 text-[10px] font-black tracking-[0.3em] uppercase lg:mb-3">Detalles</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-secondary/70">
                    {product.details.trim()}
                  </p>
                </div>
              )}

              <div className="border-t border-secondary/5 pt-10 lg:pt-5">
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
                  className="group flex w-full items-center justify-center gap-4 rounded-2xl border border-secondary/10 py-5 transition-all hover:border-secondary hover:bg-secondary/5 lg:py-3"
                >
                  <Share2 className="h-5 w-5 text-secondary/40 transition-colors group-hover:text-primary" />
                  <span className="text-[10px] font-black tracking-[0.3em] text-secondary/40 uppercase transition-colors group-hover:text-secondary">Compartir esta pieza</span>
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
            type="button"
            aria-label="Cerrar"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreen(false);
              setIsZoomed(false);
            }}
            className="fixed top-4 right-4 z-120 rounded-full bg-white p-3.5 text-secondary shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 hover:bg-white sm:top-6 sm:right-6"
          >
            <X className="h-6 w-6 stroke-[2.5]" />
          </button>

          {/* Navigation Arrows (Desktop) */}
          {!isZoomed && product.images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); changeActiveImage(prev => prev === 0 ? product.images.length - 1 : prev - 1); }}
                className="fixed left-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-110"
              >
                <ChevronRight className="w-8 h-8 rotate-180" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); changeActiveImage(prev => prev === product.images.length - 1 ? 0 : prev + 1); }}
                className="fixed right-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-110"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}


          <div 
            className={`min-h-full min-w-full flex items-center justify-center ${isZoomed ? 'w-[200vw] h-[200vh]' : ''}`}
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
                  className={`transition-all duration-500 shadow-2xl rounded-sm ${isZoomed ? 'max-w-none w-[130vw] md:w-[95vw]' : 'max-w-[90vw] max-h-[85vh] object-contain'}`}
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
                  onClick={(e) => { e.stopPropagation(); changeActiveImage(idx); }}
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
