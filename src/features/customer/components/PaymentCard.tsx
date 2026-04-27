import React from 'react';
import { Trash2, Check } from 'lucide-react';
import type { PaymentMethod, Customer } from '@/types';

interface PaymentCardProps {
  card: PaymentMethod;
  user: Customer | null;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  card,
  user,
  onDelete,
  onSetDefault
}) => {
  return (
    <div className={`p-8 rounded-4xl border transition-all relative overflow-hidden group ${
      card.is_default ? 'bg-white/10 border-primary/50' : 'bg-white/5 border-white/10 hover:border-white/20'
    }`}>
      {/* Background Decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-white/10 rounded-md flex items-center justify-center font-black italic text-[10px]">
              {card.brand}
            </div>
            {card.is_default && (
              <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 shadow-sm">
                <Check className="w-3 h-3" /> Tarjeta Principal
              </span>
            )}
          </div>
          <button 
            onClick={() => onDelete(card.id)}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-8">
          <p className="text-2xl font-display font-black tracking-[0.2em] mb-2">
            •••• •••• •••• {card.last4}
          </p>
          <div className="flex gap-8">
            <div>
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Vence</p>
              <p className="text-sm font-bold">{card.exp_month}/{card.exp_year.toString().slice(-2)}</p>
            </div>
            <div>
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Nombre</p>
              <p className="text-sm font-bold uppercase">{user?.name} {user?.surname}</p>
            </div>
          </div>
        </div>

        {!card.is_default && (
          <button 
            onClick={() => onSetDefault(card.id)}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
          >
            Establecer como principal
          </button>
        )}
      </div>
    </div>
  );
};
