import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const FeaturedSection: React.FC = () => {
  return (
    <>
      <section className="py-24 md:py-40 bg-accent">
        <div className="px-6 sm:px-12 lg:px-20 max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-5 space-y-12 text-center lg:text-left">
              <h2 className="font-serif italic text-6xl md:text-6xl lg:text-8xl leading-tight text-secondary mb-20">
                Vístete <br />
                <span className="brush-underline">para ti.</span>
              </h2>
              <p className="text-secondary/60 text-lg leading-relaxed mx-auto lg:mx-0 max-w-md font-light">
                Porque cada día es una oportunidad para gustarte más. Moda de calidad pensada para la mujer real, para que te sientas tan especial como eres. Date el capricho.
              </p>
              <Link 
                to="/conocenos"
                className="inline-flex items-center justify-center font-black tracking-[0.2em] uppercase transition-all italic bg-transparent border border-secondary/20 text-secondary hover:bg-secondary/5 px-12 py-4 text-base hover:border-primary"
              >
                CONÓCENOS
              </Link>
            </div>
            <div className="lg:col-span-7 relative">
              <div className="aspect-4/5 overflow-hidden rounded-2xl shadow-2xl">
                <motion.img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
                  className="w-full h-full object-cover scale-105"
                  alt="Feature"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-primary p-12 hidden md:block shadow-2xl">
                <p className="text-4xl font-black italic tracking-tighter uppercase text-white">TE LO<br />MERECES</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 md:py-60 relative overflow-hidden flex items-center justify-center bg-primary">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img src="https://images.unsplash.com/photo-1539109132382-381bb3f1c2b3?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Background" />
        </div>
        <div className="relative z-10 text-center max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-serif italic mb-12 leading-tight text-white max-w-4xl mx-auto">
            "Vestir bien es recordarte quién eres. Es darte ese capricho porque, simplemente, te lo mereces."
          </h2>
          <div className="w-20 h-px bg-white mx-auto mb-12" />
          <p className="text-[10px] font-black tracking-[0.6em] uppercase text-white/80">Modas Me lo Merezco</p>
        </div>
      </section>
    </>
  );
};
