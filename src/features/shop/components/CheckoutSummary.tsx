import React from 'react';
import { Truck, ShieldCheck } from 'lucide-react';
import type { CartItem } from '@/types';

interface CheckoutSummaryProps {
  items: CartItem[];
  cartTotal: number;
  shippingCost: number;
  finalTotal: number;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  items,
  cartTotal,
  shippingCost,
  finalTotal
}) => {
  return (
    <div className="sticky top-32 space-y-8">
      <div className="bg-accent-dark p-8 border border-secondary/10 rounded-2xl shadow-xl">
        <h3 className="text-xs font-black tracking-[0.4em] uppercase mb-8 border-b border-secondary/5 pb-4 text-secondary">Resumen</h3>
        <div className="space-y-6 max-h-[400px] overflow-y-auto mb-8 pr-4">
          {items.map(item => (
            <div key={`${item.product_id}-${item.selectedVariant.id}`} className="flex gap-4">
              <div className="w-16 aspect-3/4 bg-secondary/10 rounded-lg overflow-hidden">
                <img src={item.images && item.images.length > 0 ? item.images[0] : undefined} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center text-secondary">
                <p className="text-[10px] font-black uppercase tracking-tight">{item.name}</p>
                <p className="text-[9px] text-secondary/40 uppercase tracking-widest mt-1">Talla {item.selectedVariant.size} • Cantidad {item.quantity}</p>
              </div>
              <p className="text-xs font-bold self-center text-secondary">{(item.price * item.quantity).toFixed(2)}€</p>
            </div>
          ))}
        </div>
        
        <div className="space-y-4 border-t border-secondary/5 pt-6">
          <div className="flex justify-between text-xs text-secondary/40 uppercase tracking-widest">
            <span>Subtotal</span>
            <span>{cartTotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-xs text-secondary/40 uppercase tracking-widest">
            <span>Envío</span>
            <span className={shippingCost === 0 ? "text-primary font-bold" : "text-secondary font-bold"}>
              {shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)}€`}
            </span>
          </div>
          <div className="flex justify-between text-lg font-black uppercase tracking-tighter pt-4 border-t border-secondary/10 text-secondary">
            <span>Total</span>
            <span>{finalTotal.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 border border-secondary/5 text-center bg-accent-dark rounded-2xl">
           <Truck className="w-5 h-5 mx-auto mb-3 text-primary" />
           <p className="text-[8px] font-black uppercase tracking-widest text-secondary/40">Envío 24/48h</p>
        </div>
        <div className="p-6 border border-secondary/5 text-center bg-accent-dark rounded-2xl">
           <ShieldCheck className="w-5 h-5 mx-auto mb-3 text-primary" />
           <p className="text-[8px] font-black uppercase tracking-widest text-secondary/40">Garantía de Calidad</p>
        </div>
      </div>
    </div>
  );
};
