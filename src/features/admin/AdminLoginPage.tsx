import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Shield, Terminal, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from "@/store/useAdminStore";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import { ThemeToggle } from "@/components/ThemeToggle";

export const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const adminLogin = useAdminStore((state) => state.adminLogin);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const { admin, token } = await api.auth.adminLogin(username, password);
      adminLogin(admin, token);
      navigate('/admin');
    } catch (err) {
      useCartStore.getState().openModal({
        title: 'Acceso denegado',
        message: err instanceof Error ? err.message : 'Las credenciales de administrador no son válidas.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate(`/admin/recuperar-password${username ? `?email=${encodeURIComponent(username)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-(--bg-main) flex items-center justify-center p-6 font-mono transition-colors duration-300">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
      {/* Matrix-like background effect */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,0,0.1),transparent_70%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-(--bg-card) backdrop-blur-xl border border-(--border-main) p-10 relative z-10 shadow-2xl transition-colors duration-300"
      >
        <div className="flex items-center gap-3 mb-12 text-primary">
          <Terminal className="w-6 h-6" />
          <h1 className="text-xl font-black uppercase tracking-[0.3em]">System Admin</h1>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-widest"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-(--bg-main) border border-(--border-main) py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all text-(--text-main)"
                  placeholder="ROOT_USER"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-(--bg-main) border border-(--border-main) py-4 pl-12 pr-12 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all text-(--text-main)"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline"
                >
                  ¿Olvidaste la clave?
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-primary text-white font-black uppercase italic tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Authorize Access
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between opacity-30">
          <span className="text-[8px] font-bold uppercase tracking-widest">Encrypted Session</span>
          <span className="text-[8px] font-bold uppercase tracking-widest">v2.4.0</span>
        </div>
      </motion.div>
    </div>
  );
};
