import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Users, ExternalLink, Menu, X, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAdminStore } from "@/store/useAdminStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'products' | 'orders' | 'customers' | 'newsletter';
  onTabChange: (tab: 'dashboard' | 'products' | 'orders' | 'customers' | 'newsletter') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { adminLogout } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const theme = useThemeStore((state) => state.theme);

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden relative transition-colors duration-300`}>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border-main)] bg-[var(--bg-main)] fixed top-0 left-0 w-full z-50">
        <Link to="/" className="flex items-center">
          <img 
            src={theme === 'dark' ? "/LOGO MELOMEREZCO completo blanco.png" : "/LOGO MELOMEREZCO completo transparente.png"} 
            alt="Modas Me lo Merezco" 
            className="h-16 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[var(--text-main)] p-2">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 border-r border-[var(--border-main)] flex flex-col bg-[var(--bg-main)] z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-10 flex-grow overflow-y-auto">
          <div className="flex flex-col mb-16 items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={theme === 'dark' ? "/LOGO MELOMEREZCO completo blanco.png" : "/LOGO MELOMEREZCO completo transparente.png"} 
                alt="Modas Me lo Merezco" 
                className="h-56 w-auto object-contain"
              />
            </Link>
          </div>
          
          <nav className="space-y-4">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Resumen' },
              { id: 'products', icon: Package, label: 'Productos' },
              { id: 'orders', icon: ShoppingCart, label: 'Pedidos' },
              { id: 'customers', icon: Users, label: 'Clientes' },
              { id: 'newsletter', icon: Mail, label: 'Newsletter' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  onTabChange(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-all group ${
                  activeTab === item.id 
                    ? 'bg-primary text-white font-black italic border-l-4 border-white' 
                    : 'text-gray-500 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'group-hover:text-primary'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-20 pt-10 border-t border-[var(--border-main)]">
              <Link 
                to="/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center gap-4 text-primary transition-colors group ${theme === 'dark' ? 'hover:text-white' : 'hover:text-primary-dark'}`}
              >
                 <ExternalLink className="w-4 h-4" />
                 <span className="text-[9px] font-black uppercase tracking-[0.4em]">Ir a la Tienda</span>
              </Link>
          </div>
        </div>

        <div className="p-10 border-t border-[var(--border-main)]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 text-gray-500 hover:text-red-500 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg-main)] pt-24 md:pt-0 w-full relative transition-colors duration-300">
        <header className="h-auto md:h-24 py-6 md:py-0 border-b border-[var(--border-main)] flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-16 bg-[var(--bg-main)] gap-4 md:gap-0 transition-colors duration-300">
          <div className="hidden md:flex items-center gap-6 ml-auto">
            <ThemeToggle />
          </div>
        </header>
        
        <div className="p-6 md:p-16 w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};
