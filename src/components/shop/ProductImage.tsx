import React, { useState, useEffect, useRef } from 'react';
import { PRODUCT_PLACEHOLDER } from '@/lib/constants';
import { toDisplayImageUrl } from '@/lib/mediaUrl';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  onLoad?: () => void;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
}

const LOAD_TIMEOUT_MS = 15000;

export const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "",
  aspectRatio = "aspect-auto",
  onLoad,
  loading = 'lazy',
  width = 360,
  height = 480,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const displaySrc = toDisplayImageUrl(src);
  const isPlaceholder = !displaySrc || displaySrc === PRODUCT_PLACEHOLDER || error;
  const imageSrc = isPlaceholder ? PRODUCT_PLACEHOLDER : displaySrc;

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  // Handle cached images
  useEffect(() => {
    if (isPlaceholder) {
      setLoaded(true);
      onLoad?.();
      return;
    }
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
      onLoad?.();
    }
  }, [imageSrc, isPlaceholder]);

  // Si la URL remota cuelga (p. ej. r2.dev caído), no dejar el loader infinito
  useEffect(() => {
    if (isPlaceholder || loaded) return;
    const timer = window.setTimeout(() => {
      setError(true);
      setLoaded(true);
      onLoad?.();
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [imageSrc, isPlaceholder, loaded]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${isPlaceholder ? 'bg-primary' : 'bg-white'} ${containerClassName}`}>
      {/* Loading State: Centered pulsing logo */}
      {!loaded && !isPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/5">
          <img 
            src="/assets/logo/logo-corona.webp" 
            alt="Cargando..." 
            width={48}
            height={48}
            className="w-12 h-12 object-contain opacity-30 animate-pulse"
          />
        </div>
      )}
      
      <img
        ref={imgRef}
        key={imageSrc}
        src={imageSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={loading === 'eager' ? 'high' : undefined}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={() => {
          setError(true);
          setLoaded(true);
          onLoad?.();
        }}
        className={`w-full h-full transition-all duration-700 ${
          loaded || isPlaceholder ? 'opacity-100' : 'opacity-0'
        } ${
          isPlaceholder 
            ? 'object-contain p-12 md:p-20 opacity-40' 
            : 'object-cover group-hover:scale-105'
        } ${className}`}
      />

      {/* Watermark: Only for real loaded images */}
      {loaded && !isPlaceholder && (
        <div aria-hidden="true" className="absolute bottom-4 right-4 w-1/5 max-w-[100px] pointer-events-none opacity-60 select-none z-10">
          <img 
            src="/assets/logo/logo-corona-blanco.webp" 
            alt="" 
            width={100}
            height={100}
            loading="lazy"
            decoding="async"
            className="w-full h-auto drop-shadow-lg" 
          />
        </div>
      )}
    </div>
  );
};
