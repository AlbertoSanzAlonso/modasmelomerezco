import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminStore } from "@/store/useAdminStore";
import { ThemeToggle } from "@/components/ThemeToggle";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const login = useAuthStore((state) => state.login);
  const adminLogin = useAdminStore((state) => state.adminLogin);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      alert('Enlace de recuperación inválido.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const type = searchParams.get('type') || 'customer';
      
      // 1. Actualizar la contraseña en Supabase Auth (Oficial)
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // 2. Hacer login automático con la nueva clave
      if (type === 'admin') {
        const { admin: profile, token } = await api.auth.adminLogin(email, password);
        adminLogin(profile as any, token);
      } else {
        const { user: profile, token } = await api.auth.login(email, password);
        login(profile as any, token);
      }
      
      setIsSuccess(true);
      
      setTimeout(() => {
        navigate(type === 'admin' ? '/admin' : '/cuenta');
      }, 2000);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-(--bg-main) flex items-center justify-center p-6 text-center transition-colors duration-300">
        <div className="max-w-md space-y-6">
          <h1 className="text-3xl font-display font-black text-(--text-main) uppercase tracking-tighter">Enlace <span className="text-primary italic font-serif lowercase">inválido</span></h1>
          <p className="text-gray-500">Parece que el enlace de recuperación no es correcto o ha expirado.</p>
          <Link to="/login" className="inline-block text-primary font-black uppercase tracking-widest hover:underline">Volver al login</Link>
        </div>
      </div>
    );
  }

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
            <h2 className="text-3xl font-display font-black text-(--text-main) uppercase tracking-tighter">Contraseña <span className="text-primary italic font-serif lowercase">actualizada</span></h2>
            <p className="text-gray-500 text-sm">Tu contraseña ha sido cambiada correctamente. Te redirigimos a tu panel...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-display font-black text-(--text-main) uppercase tracking-tighter mb-2">Nueva <span className="italic font-serif lowercase text-primary">contraseña</span></h1>
              <p className="text-gray-500 text-sm font-medium tracking-wide">Introduce tu nueva clave de acceso para <strong>{email}</strong>.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 bg-(--bg-main) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                    placeholder="Nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 bg-(--bg-main) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                    placeholder="Confirmar contraseña"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-(--text-main) text-(--bg-main) font-black uppercase italic tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Actualizar contraseña'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
