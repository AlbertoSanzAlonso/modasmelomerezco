import { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User as UserIcon, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

interface NavbarProps {
  setIsCartOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export const Navbar: FC<NavbarProps> = ({ setIsCartOpen, isMenuOpen, setIsMenuOpen }) => {
  const { user, isAuthenticated } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const favoriteCount = user?.favorites?.length || 0;
  const location = useLocation();

  const handleInicioClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-accent/80 backdrop-blur-md border-b border-secondary/3">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <div className="flex lg:hidden flex-1">
              <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-secondary hover:text-primary transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </div>
            <div className="hidden lg:flex items-center gap-10 flex-1">
              <Link to="/" onClick={handleInicioClick} className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary hover:text-primary transition-colors">Inicio</Link>
              <Link to="/categoria/ropa" className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary hover:text-primary transition-colors">Ropa</Link>
              <Link to="/categoria/complementos" className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary hover:text-primary transition-colors">Complementos</Link>
              <Link to="/#novedades" className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary hover:text-primary transition-colors">Novedades</Link>
            </div>
            <div className="shrink-0">
              <Link to="/" className="group flex flex-col items-center leading-none">
                <img src="/assets/logo/logo-corona.png" alt="Logo" className="h-14 w-auto object-contain transition-transform group-hover:scale-110" />
              </Link>
            </div>
            <div className="flex items-center justify-end gap-4 md:gap-8 flex-1">
              <button className="hidden md:flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] uppercase text-secondary hover:text-primary transition-colors">
                <Search className="w-5 h-5" />
              </button>
              
              <Link to="/cuenta/favoritos" className="group relative flex items-center gap-3 text-secondary">
                <Heart className="w-5 h-5 group-hover:text-primary transition-colors" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              <Link to="/cuenta" className="group flex items-center gap-3 text-secondary">
                <div className={`relative ${isAuthenticated ? 'text-primary' : 'text-secondary'} transition-colors`}>
                  <UserIcon className="w-5 h-5 group-hover:text-primary transition-colors" />
                  {isAuthenticated && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-accent shadow-sm animate-pulse" />
                  )}
                </div>
                {isAuthenticated && user && (
                  <span className="hidden md:block text-[10px] font-bold tracking-[0.3em] uppercase transition-colors group-hover:text-primary">
                    {user.name.split(' ')[0]}
                  </span>
                )}
              </Link>

              <div onClick={() => setIsCartOpen(true)} className="relative cursor-pointer group flex items-center gap-3 text-secondary">
                <ShoppingBag className="w-5 h-5 group-hover:text-primary transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center lg:hidden animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
                <span className="hidden md:block text-[10px] font-bold tracking-[0.3em] uppercase">Cesta ({totalItems})</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-60 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-accent z-70 lg:hidden shadow-2xl flex flex-col overflow-y-auto"
            >
              <div className="p-6 flex justify-between items-center border-b border-secondary/3">
                <img src="/assets/logo/logo-corona.png" alt="Logo" className="h-10 w-auto" />
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-secondary hover:text-primary transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 p-10 flex flex-col gap-8">
                <Link to="/" onClick={(e) => { handleInicioClick(e); setIsMenuOpen(false); }} className="text-xl font-light tracking-[0.2em] uppercase text-secondary hover:text-primary transition-colors">Inicio</Link>
                <Link to="/categoria/ropa" onClick={() => setIsMenuOpen(false)} className="text-xl font-light tracking-[0.2em] uppercase text-secondary hover:text-primary transition-colors">Ropa</Link>
                <Link to="/categoria/complementos" onClick={() => setIsMenuOpen(false)} className="text-xl font-light tracking-[0.2em] uppercase text-secondary hover:text-primary transition-colors">Complementos</Link>
                <Link to="/#novedades" onClick={() => setIsMenuOpen(false)} className="text-xl font-light tracking-[0.2em] uppercase text-secondary hover:text-primary transition-colors">Novedades</Link>
                <div className="h-px bg-secondary/5 my-4" />
                <Link to="/cuenta/favoritos" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 text-secondary group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest group-hover:text-primary transition-colors">Mis Favoritos</span>
                </Link>
                <Link to="/envios" onClick={() => setIsMenuOpen(false)} className="text-xs font-bold tracking-[0.3em] uppercase text-secondary/60 hover:text-primary transition-colors">Envíos</Link>
                <Link to="/devoluciones" onClick={() => setIsMenuOpen(false)} className="text-xs font-bold tracking-[0.3em] uppercase text-secondary/60 hover:text-primary transition-colors">Devoluciones</Link>
                <div className="h-px bg-secondary/5 my-4" />
                <Link to="/cuenta" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 text-secondary group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isAuthenticated ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-primary/10 text-primary'}`}>
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                    {isAuthenticated && user ? user.name.split(' ')[0] : 'Mi Cuenta'}
                  </span>
                </Link>
              </nav>
              <div className="p-10 border-t border-secondary/3 space-y-6">
                <div className="flex gap-8">
                  <a href="https://www.instagram.com/modasmelomerezco" target="_blank" rel="noopener noreferrer" className="text-secondary/60 hover:text-primary transition-colors">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.281.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://www.tiktok.com/@modasmelomerezco" target="_blank" rel="noopener noreferrer" className="text-secondary/60 hover:text-primary transition-colors">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512">
                      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                    </svg>
                  </a>
                  <a href="https://www.facebook.com/profile.php?id=61555721379464" target="_blank" rel="noopener noreferrer" className="text-secondary/60 hover:text-primary transition-colors">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-secondary/40 uppercase leading-relaxed">
                  Estilo y calidad para tu día a día.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
