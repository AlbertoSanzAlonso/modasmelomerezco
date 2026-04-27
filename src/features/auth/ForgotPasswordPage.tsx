import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";

interface ForgotPasswordPageProps {
  isAdmin?: boolean;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ isAdmin = false }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = searchParams.get('email') || '';

  const [emailOrUser, setEmailOrUser] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let targetEmail = '';
      let type: 'admin' | 'customer' = isAdmin ? 'admin' : 'customer';

      if (isAdmin) {
        let admin = await api.admins.getByUsername(emailOrUser);
        if (!admin) {
          admin = await api.admins.getByEmail(emailOrUser);
        }
        if (!admin || !admin.email) {
          throw new Error('Cuenta de administrador no encontrada o sin email configurado.');
        }
        targetEmail = admin.email;
      } else {
        const customer = await api.customers.getByEmail(emailOrUser);
        if (!customer) {
          throw new Error('No hemos encontrado ninguna cuenta con ese correo electrónico.');
        }
        targetEmail = customer.email;
      }

      await api.mail.sendPasswordRecovery(
        targetEmail, 
        `${window.location.origin}/reset-password?email=${encodeURIComponent(targetEmail)}${isAdmin ? '&type=admin' : ''}`
      );
      
      setSentTo(targetEmail);
      setIsSuccess(true);
    } catch (error) {
      useCartStore.getState().openModal({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo procesar la solicitud.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-main) flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
      
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-(--bg-card) p-10 rounded-[2.5rem] border border-(--border-main) shadow-2xl relative z-10"
      >
        {isSuccess ? (
          <div className="text-center space-y-6 py-10 animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-display font-black text-(--text-main) uppercase tracking-tighter">Email <span className="text-primary italic font-serif lowercase">enviado</span></h2>
            <p className="text-gray-500 text-sm">Hemos enviado un enlace de recuperación a <strong>{sentTo}</strong>. Revisa tu bandeja de entrada y spam.</p>
            <Button 
              className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic mt-4"
              onClick={() => navigate(isAdmin ? '/admin/login' : '/login')}
            >
              Volver al inicio
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <Link to="/" className="inline-block mb-8">
                <img 
                  src="/assets/logo/LOGO MELOMEREZCO corona.svg" 
                  alt="Logo" 
                  className="w-20 h-20 object-contain mx-auto"
                />
              </Link>
              <h1 className="text-3xl font-display font-black text-(--text-main) uppercase tracking-tighter mb-2 italic">¿Has olvidado la <span className="text-primary lowercase font-serif">clave</span>?</h1>
              <p className="text-gray-500 text-sm font-medium tracking-wide">Introduce tu {isAdmin ? 'usuario o ' : ''}email para recibir un enlace de recuperación.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={isAdmin ? "text" : "email"}
                  required
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-(--bg-main) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                  placeholder={isAdmin ? "Usuario o email de admin" : "tu@email.com"}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-(--text-main) text-(--bg-main) font-black uppercase italic tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar enlace'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link 
                to={isAdmin ? "/admin/login" : "/login"} 
                className="text-gray-500 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Volver atrás
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
