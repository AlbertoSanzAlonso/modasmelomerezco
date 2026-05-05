import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/Button";

interface NewsletterSectionProps {
  email: string;
  setEmail: (email: string) => void;
  isSubmitting: boolean;
  isSubscribed: boolean;
  onSubscribe: (e: React.FormEvent) => void;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  email,
  setEmail,
  isSubmitting,
  isSubscribed,
  onSubscribe
}) => {
  return (
    <section className="py-24 md:py-40 bg-white text-black relative overflow-hidden">
      {/* Decorative Brush Heart Background */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[350px] md:w-[700px] h-auto opacity-[0.18] pointer-events-none select-none -rotate-12 z-0 mix-blend-multiply">
        <img 
          src="/assets/corazon-brocha.png" 
          alt="" 
          className="w-full h-auto"
        />
      </div>

      <div className="max-w-[1800px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        <div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-6">ÚNETE A NOSOTRAS</h2>
          <p className="text-gray-500 text-lg max-w-md font-medium">Suscríbete para enterarte de las últimas novedades, consejos de estilo y cositas especiales que preparamos para ti.</p>
        </div>
        <div className="flex flex-col gap-4">
          {isSubscribed ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary/5 p-8 rounded-2xl text-center"
            >
              <h3 className="text-2xl font-black italic uppercase text-primary mb-4">¡Casi estás dentro!</h3>
              <p className="text-sm font-bold text-gray-700 mb-2">Te hemos enviado un email de confirmación.</p>
              <p className="text-xs text-gray-500">Por favor, revisa tu <span className="underline decoration-primary/30 underline-offset-4 font-bold text-gray-600">bandeja de entrada o carpeta de spam</span> y haz clic en el enlace para activar tu suscripción.</p>
            </motion.div>
          ) : (
            <form onSubmit={onSubscribe} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="TU DIRECCIÓN DE EMAIL"
                  className="flex-1 border-b-2 border-black bg-transparent px-2 py-4 text-sm font-bold focus:outline-none focus:border-primary placeholder:text-gray-300 min-w-0 disabled:opacity-50"
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  className="px-8 md:px-12 font-black whitespace-nowrap"
                  isLoading={isSubmitting}
                >
                  UNIRSE
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-4">Al suscribirte aceptas nuestra política de privacidad.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
