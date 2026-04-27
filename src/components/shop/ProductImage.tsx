
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCT_PLACEHOLDER } from '@/lib/constants';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "",
  aspectRatio = "aspect-3/4"
}) => {
  const [loaded, setLoaded] = useState(false);
  const isPlaceholder = !src || src === PRODUCT_PLACEHOLDER;
  const imageSrc = src || PRODUCT_PLACEHOLDER;

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${isPlaceholder ? 'bg-primary' : 'bg-accent-dark'} ${containerClassName}`}>
      {!loaded && !isPlaceholder && (
        <div className="absolute inset-0 animate-pulse bg-secondary/10" />
      )}
      
      <AnimatePresence mode="wait">
        <motion.img
          key={imageSrc}
          src={imageSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`w-full h-full transition-all duration-500 ${
            isPlaceholder 
              ? 'object-contain p-12 md:p-20 opacity-80' 
              : 'object-cover group-hover:scale-105'
          } ${className} ${loaded || isPlaceholder ? 'opacity-100' : 'opacity-0'}`}
        />
      </AnimatePresence>

      {loaded && !isPlaceholder && (
        <div className="absolute bottom-4 right-4 w-1/5 max-w-[100px] pointer-events-none opacity-60 select-none z-10">
          <img 
            src="/LOGO%20MELOMEREZCO%20corona%20blanco.png" 
            alt="" 
            className="w-full h-auto drop-shadow-lg" 
          />
        </div>
      )}
    </div>
  );
};
