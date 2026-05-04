import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/Button";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-accent z-101 shadow-2xl flex flex-col text-secondary"
          >
            <div className="p-8 border-b border-secondary/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold tracking-tight uppercase">Tu Carrito</h2>
                <span className="text-[10px] bg-secondary/5 px-2 py-1 rounded-full text-secondary/40">
                  {items.length} artículos
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-800 mb-4" />
                  <p className="text-gray-500 mb-8">Tu carrito está vacío</p>
                  <Link to="/categoria/ropa" onClick={onClose} className="w-full max-w-[200px]">
                    <Button variant="outline" className="w-full">Empezar a comprar</Button>
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.product_id}-${item.selectedVariant.id}`} className="flex gap-6 group">
                    <div className="w-24 aspect-3/4 bg-secondary/5 overflow-hidden rounded-lg">
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-bold leading-tight">{item.name}</h3>
                          <button 
                            onClick={() => removeItem(`${item.product_id}-${item.selectedVariant.id}`)}
                            className="text-gray-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">
                          Talla: {item.selectedVariant.size} • {item.selectedVariant.color}
                        </p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex items-center border border-secondary/10 rounded-md overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(`${item.product_id}-${item.selectedVariant.id}`, Math.max(1, item.quantity - 1))}
                            className="p-1 hover:bg-secondary/5 text-secondary/40"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(`${item.product_id}-${item.selectedVariant.id}`, item.quantity + 1)}
                            className="p-1 hover:bg-secondary/5 text-secondary/40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-bold text-sm text-secondary">{(item.price * item.quantity).toFixed(2)}€</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 border-t border-secondary/5 bg-accent-dark">
                <div className="flex justify-between items-center mb-8 text-secondary">
                  <p className="text-secondary/40 text-xs uppercase tracking-widest">Total Estimado</p>
                  <p className="text-2xl font-bold">{total.toFixed(2)}€</p>
                </div>
                <Link to="/checkout" onClick={onClose}>
                  <Button className="w-full py-5 text-base font-black italic tracking-widest bg-primary hover:bg-primary-dark text-white shadow-xl shadow-primary/20" size="lg">Finalizar Compra</Button>
                </Link>
                <p className="text-[10px] text-secondary/40 text-center mt-6 uppercase tracking-widest">
                  Envío gratuito en pedidos superiores a 60€
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
