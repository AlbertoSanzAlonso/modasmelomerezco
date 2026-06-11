import React from 'react';
import { Button } from "@/components/ui/Button";

interface CheckoutSuccessModalProps {
  show: boolean;
  onNavigate: (path: string) => void;
}

export const CheckoutSuccessModal: React.FC<CheckoutSuccessModalProps> = ({ show, onNavigate }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-secondary/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="mb-8 flex justify-center animate-bounce">
          <img src="/assets/logo/LOGO MELOMEREZCO corona.svg" alt="Modas Me lo Merezco" className="w-24 h-24 object-contain" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-display font-black uppercase tracking-tighter italic">
            ¡Pedido <span className="text-primary italic font-serif lowercase">confirmado</span>!
          </h2>
          <p className="text-sm text-secondary/60 font-medium leading-relaxed">
            Tu pedido se ha procesado correctamente. Hemos enviado un correo con los detalles de tu compra.
          </p>
        </div>
        <div className="pt-4">
          <Button onClick={() => onNavigate('/cuenta/pedidos')} className="w-full bg-primary hover:bg-secondary text-white py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-primary/20">
            Ver mis pedidos
          </Button>
        </div>
      </div>
    </div>
  );
};
