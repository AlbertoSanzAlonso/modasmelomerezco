import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/Button";

export const AddToCartModal: React.FC = () => {
  const { modalConfig, closeModal } = useCartStore();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-accent w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl border border-secondary/5"
          >
            <div className="p-8 text-center">
              <div className="mb-8 flex justify-center">
                <img 
                  src="/assets/logo/LOGO MELOMEREZCO corona.svg" 
                  alt="Logo" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              
              <h3 className="text-xl font-black uppercase tracking-tight italic mb-2 text-secondary">
                {modalConfig.title}
              </h3>
              <p className="text-secondary/60 text-sm mb-8 font-light leading-relaxed">
                {modalConfig.message}
              </p>

              <div className="space-y-3">
                {modalConfig.type === 'success' ? (
                  <>
                    <Button 
                      className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic"
                      onClick={() => {
                        if (modalConfig.onAction) {
                          modalConfig.onAction();
                        } else {
                          closeModal();
                          useCartStore.getState().setIsCartOpen(true);
                        }
                      }}
                    >
                      {modalConfig.actionLabel || 'Ir a la cesta'}
                    </Button>
                    
                    <button 
                      onClick={closeModal}
                      className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/40 hover:text-secondary transition-colors"
                    >
                      {modalConfig.actionLabel ? 'Cerrar' : 'Seguir comprando'}
                    </button>
                  </>
                ) : modalConfig.type === 'favorites' ? (
                  <>
                    <Button 
                      className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic"
                      onClick={() => {
                        closeModal();
                        navigate('/cuenta/favoritos');
                      }}
                    >
                      Ir a favoritos
                    </Button>
                    
                    <button 
                      onClick={closeModal}
                      className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/40 hover:text-secondary transition-colors"
                    >
                      Seguir comprando
                    </button>
                  </>
                ) : modalConfig.title === 'Inicia sesión' ? (
                  <>
                    <Button 
                      className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic"
                      onClick={() => {
                        closeModal();
                        navigate('/login');
                      }}
                    >
                      Ir a iniciar sesión
                    </Button>
                    <button 
                      onClick={closeModal}
                      className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/40 hover:text-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : modalConfig.type === 'confirm' ? (
                  <>
                    <Button 
                      className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic bg-red-500 hover:bg-red-600"
                      onClick={() => {
                        modalConfig.onConfirm?.();
                        closeModal();
                      }}
                    >
                      Confirmar
                    </Button>
                    <button 
                      onClick={closeModal}
                      className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/40 hover:text-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : modalConfig.type === 'action' ? (
                  <>
                    <Button 
                      className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic"
                      onClick={() => {
                        modalConfig.onAction?.();
                        closeModal();
                      }}
                    >
                      Aceptar
                    </Button>
                    <button 
                      onClick={closeModal}
                      className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/40 hover:text-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : modalConfig.type === 'warning' || modalConfig.type === 'error' ? (
                  <>
                    <Button 
                      className={`w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic ${modalConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
                      onClick={() => {
                        modalConfig.onAction?.();
                        closeModal();
                      }}
                    >
                      {modalConfig.actionLabel || 'Entendido'}
                    </Button>
                  </>
                ) : modalConfig.type === 'product_created' ? (
                  <>
                    <Button 
                      className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic"
                      onClick={() => {
                        modalConfig.onAction?.();
                        closeModal();
                      }}
                    >
                      {modalConfig.actionLabel || 'Publicar y Ver'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic border-secondary/20"
                      onClick={() => {
                        modalConfig.onSecondaryAction?.();
                        closeModal();
                      }}
                    >
                      {modalConfig.secondaryActionLabel || 'Mantener Oculto'}
                    </Button>

                    <button 
                      onClick={closeModal}
                      className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/40 hover:text-secondary transition-colors"
                    >
                      Volver al Panel
                    </button>
                  </>
                ) : (
                  <Button 
                    className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] italic"
                    onClick={() => {
                      if (modalConfig.onAction) {
                        modalConfig.onAction();
                      }
                      closeModal();
                    }}
                  >
                    {modalConfig.actionLabel || 'Aceptar'}
                  </Button>
                )}
              </div>
            </div>

            {/* Close button top right */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-secondary/20 hover:text-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
