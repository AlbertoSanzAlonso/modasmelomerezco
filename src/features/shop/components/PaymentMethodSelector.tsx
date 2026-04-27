import React from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';

type PaymentMethodType = 'card' | 'bizum';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelect: (method: PaymentMethodType) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect
}) => {
  return (
    <section className="bg-secondary/5 p-8 border border-secondary/10 rounded-2xl">
      <div className="flex items-center gap-4 mb-8">
        <CreditCard className="text-primary w-5 h-5" />
        <h3 className="text-xs font-black tracking-[0.4em] uppercase text-secondary">Método de Pago</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Option */}
        <div 
          onClick={() => onSelect('card')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col gap-4 ${
            selectedMethod === 'card' 
              ? 'bg-primary/5 border-primary shadow-lg' 
              : 'bg-white/5 border-white/10 hover:border-white/30'
          }`}
        >
          <div className="flex justify-between items-center">
            <CreditCard className={`w-6 h-6 ${selectedMethod === 'card' ? 'text-primary' : 'text-secondary/40'}`} />
            {selectedMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Tarjeta Bancaria</p>
            <p className="text-[9px] text-secondary/40 uppercase tracking-tighter mt-1">Visa, Mastercard, Maestro</p>
          </div>
        </div>

        {/* Bizum Option */}
        <div 
          onClick={() => onSelect('bizum')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col gap-4 ${
            selectedMethod === 'bizum' 
              ? 'bg-primary/5 border-primary shadow-lg' 
              : 'bg-white/5 border-white/10 hover:border-white/30'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded-full border-2 ${
              selectedMethod === 'bizum' ? 'bg-primary border-primary text-white' : 'border-secondary/20 text-secondary/40'
            }`}>
              B
            </div>
            {selectedMethod === 'bizum' && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Bizum</p>
            <p className="text-[9px] text-secondary/40 uppercase tracking-tighter mt-1">Pago instantáneo con tu móvil</p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-secondary/5">
        <p className="text-[10px] text-secondary/40 font-medium italic leading-relaxed">
          Al hacer clic en el botón de pago, serás redirigido a la pasarela segura de **Redsys** para completar la transacción mediante {selectedMethod === 'card' ? 'tarjeta' : 'Bizum'}.
        </p>
      </div>
    </section>
  );
};
