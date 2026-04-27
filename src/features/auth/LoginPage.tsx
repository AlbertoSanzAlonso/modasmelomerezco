import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import { ThemeToggle } from "@/components/ThemeToggle";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Load remembered email
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { user, token } = await api.auth.login(email, password);
      login(user, token);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      const from = (location.state as any)?.from || '/';
      
      // Handle pending favorite
      const pendingFavorite = useAuthStore.getState().pendingFavorite;
      if (pendingFavorite) {
        const currentFavorites = user.favorites || [];
        if (!currentFavorites.includes(pendingFavorite)) {
          const newFavorites = [...currentFavorites, pendingFavorite];
          await api.customers.update(user.customer_id, { favorites: newFavorites });
          useAuthStore.getState().updateUser({ favorites: newFavorites });
        }
        
        useAuthStore.getState().setPendingFavorite(null);
        
        // Show success modal
        import("@/store/useCartStore").then(m => {
          m.useCartStore.getState().openModal({
            title: 'Añadido a favoritos',
            message: 'Hemos guardado el artículo en tu lista mientras iniciabas sesión.',
            type: 'favorites'
          });
        });

        navigate(`/producto/${pendingFavorite}`);
      } else {
        navigate(from);
      }
    } catch (error) {
      useCartStore.getState().openModal({
        title: 'Error de acceso',
        message: error instanceof Error ? error.message : 'Las credenciales introducidas no son correctas.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate(`/recuperar-password${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-(--bg-main) flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
      {/* Abstract Background Decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <img 
              src="/assets/logo/LOGO MELOMEREZCO corona.svg" 
              alt="Logo" 
              className="w-28 h-28 object-contain"
            />
          </motion.div>
          
          <h1 className="text-4xl font-display font-black text-(--text-main) uppercase tracking-tighter mb-2 transition-colors duration-300">
            Bienvenida de <span className="italic font-serif lowercase text-primary">nuevo</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium tracking-wide">
            Entra para ver tus pedidos y novedades.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-(--bg-card) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                placeholder="tu@email.com"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-12 py-4 bg-(--bg-card) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
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
          </div>

          <div className="flex items-center justify-between text-xs px-2">
            <label className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20" 
              />
              <span className="font-bold uppercase tracking-widest">Recordarme</span>
            </label>
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-primary font-black uppercase tracking-widest hover:underline"
            >
              ¿Olvidaste la clave?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-(--text-main) text-(--bg-main) font-black uppercase italic tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <Link 
            to="/registro" 
            className="text-gray-500 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.3em] italic"
          >
            ¿Aún no tienes cuenta?
          </Link>
        </div>
          <div className="pt-6 border-t border-(--border-main)/5">
            <Link to="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-2">
              <span className="text-lg">←</span> Volver a la tienda
            </Link>
          </div>
      </motion.div>
    </div>
  );
};
