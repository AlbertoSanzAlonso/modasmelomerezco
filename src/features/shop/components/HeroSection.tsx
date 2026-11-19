import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const HeroSection: React.FC = () => {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <motion.div 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="absolute inset-0 z-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-secondary/40 z-10" />
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="w-full h-full object-cover"
        >
          <source src="/assets/videos/hero.mp4" type="video/mp4" />
          <track
            kind="captions"
            src="data:text/vtt;charset=utf-8,WEBVTT"
            srcLang="es"
            label="Vídeo decorativo sin audio"
          />
        </video>
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-20 w-full max-w-[1800px] px-6 mx-auto flex flex-col items-center">
        <h1 className="sr-only">
          Tienda online de moda para mujer | Modas Me lo Merezco
        </h1>
        <div className="flex flex-col items-center">
          <img 
            src="/assets/logo/logo-completo-blanco.svg" 
            alt="Modas Me Lo Merezco" 
            width={960}
            height={960}
            fetchPriority="high"
            decoding="async"
            className="w-[85vw] md:w-[60vw] max-w-4xl h-auto mx-auto drop-shadow-2xl animate-float md:-mt-32"
            style={{ filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.3))' }}
          />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        aria-hidden="true"
        className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40"
      >
        <span className="text-[10px] font-bold tracking-[0.5em] uppercase vertical-rl text-white">Desliza</span>
        <div className="w-px h-12 bg-white" />
      </div>
    </section>
  );
};
