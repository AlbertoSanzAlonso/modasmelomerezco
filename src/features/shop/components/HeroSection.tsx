import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const HeroSection: React.FC = () => {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
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
          <source src="/assets/video/herovideo.mp4" type="video/mp4" />
        </video>
      </motion.div>

      <div className="relative z-20 text-center space-y-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <img 
            src="/assets/logo/logo-completo-blanco.svg" 
            alt="Modas Me Lo Merezco" 
            className="h-32 md:h-56 w-auto drop-shadow-2xl"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.4em] italic drop-shadow-md">
            Tu boutique de moda femenina en Benalmádena
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent animate-scroll-down" />
      </motion.div>
    </section>
  );
};
