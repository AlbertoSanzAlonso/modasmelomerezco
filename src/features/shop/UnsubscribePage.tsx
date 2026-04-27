import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailX, Loader2, ArrowRight } from 'lucide-react';
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'not-found'>('loading');
  const email = searchParams.get('email');

  useEffect(() => {
    const unsubscribe = async () => {
      if (!email) {
        setStatus('not-found');
        return;
      }

      try {
        const sub = await api.subscriptions.getByEmail(email);
        if (sub) {
          if (sub.status !== 'unsubscribed') {
            await api.subscriptions.update(sub.id, { status: 'unsubscribed' });
          }
          setStatus('success');
        } else {
          setStatus('not-found');
        }
      } catch (error) {
        console.error('Error unsubscribing:', error);
        setStatus('error');
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-accent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 md:p-16 rounded-[2.5rem] shadow-xl text-center border border-gray-100"
      >
        {status === 'loading' && (
          <div className="space-y-6">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Procesando...</h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Dándote de baja de nuestra lista</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <MailX className="w-10 h-10 text-gray-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">¡Baja tramitada!</h2>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Te echaremos de menos</p>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Tu correo <strong className="text-gray-700">{email}</strong> ha sido eliminado de nuestra lista de envío. Ya no recibirás más correos promocionales de nuestra parte.
            </p>
            <Link to="/" className="block pt-4">
              <Button className="w-full py-6 font-black tracking-widest uppercase italic group">
                IR A LA TIENDA <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}

        {(status === 'error' || status === 'not-found') && (
          <div className="space-y-8">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <MailX className="w-10 h-10 text-gray-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                {status === 'not-found' ? 'Email no encontrado' : 'Error al procesar'}
              </h2>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              {status === 'not-found' 
                ? 'No hemos encontrado ninguna suscripción activa con ese correo electrónico.' 
                : 'Hubo un problema al intentar procesar tu baja. Por favor, inténtalo de nuevo más tarde.'}
            </p>
            <Link to="/" className="block pt-4">
              <Button variant="outline" className="w-full py-6 font-black tracking-widest uppercase italic group">
                IR A LA TIENDA <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UnsubscribePage;
