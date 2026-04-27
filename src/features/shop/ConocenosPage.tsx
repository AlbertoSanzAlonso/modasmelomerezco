import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NewsletterSection } from './components/NewsletterSection';
import { api } from "@/lib/api";

const ConocenosPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await api.subscriptions.create({
        email,
        status: 'pending',
        confirmation_token: token
      });
      await api.mail.sendConfirmationEmail(email, token);
      setIsSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error al suscribirse. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-accent/20">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/conocenos-hero.png" 
            alt="Modas Me Lo Merezco - Sobre Nosotros" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-secondary/50 z-10" />
          <div className="absolute inset-0 bg-primary/10 mix-blend-color z-10" />
        </div>
        
        <div className="relative z-10 text-center px-4 md:px-6 max-w-4xl mx-auto flex flex-col items-center space-y-4 md:space-y-6">
          <motion.img
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            src="/assets/logo/LOGO MELOMEREZCO corona blanco.svg"
            alt="Logo Corona"
            className="w-24 md:w-32 lg:w-48 mb-0 md:-mb-2 drop-shadow-lg"
          />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-8xl text-white mb-6 uppercase tracking-[0.2em]"
            style={{ fontFamily: "'Typograph Pro', 'Montserrat', sans-serif", fontWeight: 300 }}
          >
            Conócenos
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xs md:text-base text-white/90 uppercase tracking-[0.3em] max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: "'Adobe Garamond Pro', 'EB Garamond', serif", fontWeight: 'bold' }}
          >
            Donde la elegancia, la pasión y el estilo se encuentran a la orilla del mar.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif italic text-4xl md:text-6xl lg:text-8xl leading-tight text-secondary">
              <span className="brush-underline-straight">Nuestra Historia.</span>
            </h2>
              <p className="text-gray-700 leading-relaxed mb-6 text-lg font-light mt-12">
                Modas "Me Lo Merezco" nació de una idea sencilla pero poderosa: cada mujer merece sentirse hermosa, segura y única. Nuestra boutique no es solo una tienda de ropa, es un espacio dedicado a celebrar la feminidad y el buen gusto.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg font-light">
                Seleccionamos cuidadosamente cada prenda pensando en ti, buscando siempre la máxima calidad, las últimas tendencias y ese toque exclusivo que te haga brillar en cualquier ocasión. Porque tú eres el centro de todo lo que hacemos.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-4/5 bg-white p-4 shadow-2xl rounded-sm transform rotate-2">
                <img 
                  src="/assets/conocenos-hero.png" 
                  alt="Equipo Me Lo Merezco" 
                  className="w-full h-full object-cover rounded-sm"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white text-primary p-6 rounded-full shadow-xl">
                <Heart className="w-8 h-8" />
              </div>
            </motion.div>
          </div>
</div>
      </section>

      {/* Quote Section */}

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white text-center px-4">
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-6xl font-serif italic leading-tight text-white max-w-4xl mx-auto"
          >
            Porque tú te lo mereces.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[10px] font-black tracking-[0.6em] uppercase text-white/80 mt-12"
          >
            Descubre nuestra nueva colección y encuentra el look perfecto para tu próxima ocasión especial.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <Link 
              to="/" 
              className="inline-flex items-center justify-center font-black tracking-[0.2em] uppercase transition-all italic bg-transparent border border-white text-white hover:bg-white hover:text-primary px-12 py-4 text-base"
            >
              VER COLECCIÓN
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection 
        email={email}
        setEmail={setEmail}
        isSubmitting={isSubmitting}
        isSubscribed={isSubscribed}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
};

export default ConocenosPage;
