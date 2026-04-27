import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import type { Product } from '@/types';

interface NewArrivalsSectionProps {
  products: Product[] | undefined;
  isLoading: boolean;
}

export const NewArrivalsSection: React.FC<NewArrivalsSectionProps> = ({
  products,
  isLoading
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 500;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="novedades" className="pt-16 pb-16 md:pt-40 md:pb-20 bg-accent-dark">
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end text-center md:text-left mb-12 md:mb-24 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-primary font-black tracking-[0.4em] uppercase text-xs mb-4 block">Date un capricho</span>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-secondary">Novedades</h3>
          </div>
          <Link to="/categoria/ropa" className="group flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase border-b border-secondary/10 pb-1 text-secondary hover:text-primary transition-all">
            Ver colección completa <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-6 md:gap-12 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[160px] sm:w-[300px] md:w-[450px] aspect-3/4 bg-white/5 animate-pulse rounded-2xl flex-shrink-0" />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden md:flex justify-center gap-12 mb-10">
              <button onClick={() => scroll('left')} className="group flex items-center gap-4 text-primary transition-all">
                <div className="w-12 h-[1px] bg-primary/20 group-hover:w-20 transition-all origin-right" />
                <ArrowRight className="w-8 h-8 rotate-180 stroke-[1px]" />
              </button>
              <button onClick={() => scroll('right')} className="group flex items-center gap-4 text-primary transition-all">
                <ArrowRight className="w-8 h-8 stroke-[1px]" />
                <div className="w-12 h-[1px] bg-primary/20 group-hover:w-20 transition-all origin-left" />
              </button>
            </div>

            <motion.div 
              ref={scrollContainerRef}
              className="flex gap-6 md:gap-12 overflow-x-auto pb-8 md:pb-16 no-scrollbar snap-x snap-mandatory"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8 }}
            >
              {products?.map((product: Product) => (
                <div 
                  key={product.product_id}
                  className="w-[160px] sm:w-[300px] md:w-[400px] lg:w-[450px] snap-center snap-always flex-shrink-0"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};
