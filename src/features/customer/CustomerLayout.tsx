import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  CreditCard, 
  User, 
  LogOut, 
  ChevronRight,
  ShoppingBag,
  Menu,
  X,
  Heart,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import { ThemeToggle } from "@/components/ThemeToggle";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const [isNavOpen, setIsNavOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: ShoppingBag, path: '/cuenta' },
    { id: 'favorites', label: 'Favoritos', icon: Heart, path: '/cuenta/favoritos' },
    { id: 'orders', label: 'Mis Pedidos', icon: Package, path: '/cuenta/pedidos' },
    { id: 'payment', label: 'Métodos de Pago', icon: CreditCard, path: '/cuenta/pagos' },
    { id: 'profile', label: 'Perfil', icon: User, path: '/cuenta/perfil' },
  ];

  const theme = useThemeStore((state) => state.theme);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-(--bg-main) text-(--text-main) flex flex-col md:flex-row transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className="w-full md:w-80 border-b md:border-r border-(--border-main) bg-(--bg-main) p-6 md:p-8 flex flex-col transition-colors duration-300">
        <div className="flex justify-between items-center md:mb-12">
          <div>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-1">Panel de Usuario</p>
            <h2 className="text-xl font-display font-black uppercase tracking-tighter">Mi Espacio</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="md:hidden p-2 bg-secondary/5 rounded-xl text-primary hover:bg-secondary/10 transition-all"
            >
              {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <ThemeToggle />
          </div>
        </div>

        <AnimatePresence>
          {(isNavOpen || window.innerWidth >= 768) && (
            <motion.div
              initial={window.innerWidth < 768 ? { height: 0, opacity: 0 } : {}}
              animate={window.innerWidth < 768 ? { height: 'auto', opacity: 1 } : {}}
              exit={window.innerWidth < 768 ? { height: 0, opacity: 0 } : {}}
              transition={{ duration: 0.3 }}
              className="overflow-hidden md:overflow-visible"
            >
              <nav className="space-y-2 mt-8">
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-4 p-4 mb-6 rounded-2xl text-primary bg-primary/5 hover:bg-primary hover:text-white transition-all group border border-primary/20"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Volver a la tienda</span>
                </button>

                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setIsNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                      location.pathname === item.path 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-gray-500 hover:text-(--text-main) hover:bg-(--bg-card)'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-white' : 'group-hover:text-primary'} transition-colors`} />
                      <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${location.pathname === item.path ? 'opacity-100 translate-x-1' : ''}`} />
                  </button>
                ))}
              </nav>

              <button 
                onClick={handleLogout}
                className="mt-8 md:mt-12 flex items-center gap-4 p-4 text-gray-500 hover:text-red-500 transition-colors group"
              >
                <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
