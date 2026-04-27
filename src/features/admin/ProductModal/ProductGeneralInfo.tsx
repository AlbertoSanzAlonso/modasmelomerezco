
import React from 'react';

interface ProductGeneralInfoProps {
  name: string;
  price: number;
  onNameChange: (value: string) => void;
  onPriceChange: (value: number) => void;
}

export const ProductGeneralInfo: React.FC<ProductGeneralInfoProps> = ({
  name,
  price,
  onNameChange,
  onPriceChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Nombre del Producto</label>
        <input 
          required
          className="w-full bg-(--bg-card) border border-(--border-main) px-6 py-4 text-sm font-bold focus:border-primary outline-none uppercase italic text-(--text-main) rounded-xl"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Precio (€)</label>
        <input 
          type="number"
          step="0.01"
          required
          className="w-full bg-(--bg-card) border border-(--border-main) px-6 py-4 text-sm font-bold focus:border-primary outline-none text-(--text-main) rounded-xl"
          value={price}
          onChange={(e) => onPriceChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};
