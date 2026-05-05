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
      >
        <div className="absolute inset-0 bg-secondary/40 z-10" />
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/assets/videos/hero.mp4" type="video/mp4" />
          <source src="/assets/videos/hero.webm" type="video/webm" />
        </video>
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-20 w-full max-w-[1800px] px-6 mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <img 
            src="/assets/logo/logo-completo-blanco.svg" 
            alt="Modas Me Lo Merezco" 
            className="w-[85vw] md:w-[60vw] max-w-4xl mx-auto drop-shadow-2xl animate-float md:-mt-32"
            style={{ filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.3))' }}
          />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span className="text-[10px] font-bold tracking-[0.5em] uppercase vertical-rl text-white">Desliza</span>
        <div className="w-px h-12 bg-white" />
      </motion.div>
    </section>
  );
};
