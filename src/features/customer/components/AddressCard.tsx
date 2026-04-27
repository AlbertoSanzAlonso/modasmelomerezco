import React from 'react';
import { Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import type { Address } from '@/types';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({ address, onEdit, onDelete }) => {
  return (
    <div className={`p-8 rounded-4xl border transition-all group relative overflow-hidden ${
      address.isDefault 
        ? 'bg-primary/10 border-primary/20 shadow-lg shadow-primary/5' 
        : 'bg-gray-50 border-gray-100 hover:border-primary/20 hover:bg-white'
    }`}>
      {/* Decorative elements for default address */}
      {address.isDefault && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
              {address.type}
            </span>
            {address.isDefault && (
              <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 shadow-sm self-start">
                <CheckCircle2 className="w-3 h-3" /> Dirección de Envío Principal
              </span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(address)} 
              className="p-2 text-gray-400 hover:text-primary transition-colors bg-white rounded-full shadow-sm border border-gray-100"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => onDelete(address.shipping_address_id!)} 
              className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm border border-gray-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-secondary">{address.street}</p>
          {(address.floor || address.door || address.stair) && (
            <p className="text-[11px] text-gray-500 font-medium">
              {address.floor && `Piso ${address.floor}`} {address.door && `Pta ${address.door}`} {address.stair && `Esc ${address.stair}`}
            </p>
          )}
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-tight">
            {address.zip} {address.city} ({address.province})
          </p>
        </div>
      </div>
    </div>
  );
};
