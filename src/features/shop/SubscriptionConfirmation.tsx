import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

const SubscriptionConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    const confirmSub = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        await api.subscriptions.confirm(token);
        setStatus('success');
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
      }
    };

    confirmSub();
  }, [token]);

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
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Confirmando...</h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Estamos activando tu suscripción</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8">
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">¡Suscripción Activa!</h2>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Ya formas parte de Modas Me lo Merezco</p>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              A partir de ahora recibirás nuestras novedades y promociones exclusivas directamente en tu email.
            </p>
            <Link to="/" className="block">
              <Button className="w-full py-6 font-black tracking-widest uppercase italic group">
                IR A LA TIENDA <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Error de Activación</h2>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">El enlace es inválido o ha expirado</p>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Si crees que esto es un error, por favor intenta suscribirte de nuevo desde la página de inicio.
            </p>
            <Link to="/" className="block">
              <Button variant="outline" className="w-full py-6 font-black tracking-widest uppercase italic">
                VOLVER AL INICIO
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionConfirmation;
