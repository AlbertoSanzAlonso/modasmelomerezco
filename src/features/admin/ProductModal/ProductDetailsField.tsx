
import React from 'react';

interface ProductDetailsFieldProps {
  details?: string | null;
  onDetailsChange: (value: string) => void;
}

export const ProductDetailsField: React.FC<ProductDetailsFieldProps> = ({
  details,
  onDetailsChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
          Detalles del Producto
        </label>
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
          Opcional. Se muestra en la ficha pública del artículo.
        </p>
      </div>
      <textarea
        rows={5}
        className="w-full bg-(--bg-card) border border-(--border-main) px-6 py-4 text-sm font-medium focus:border-primary outline-none text-(--text-main) rounded-xl resize-y min-h-[140px]"
        value={details || ''}
        onChange={(e) => onDetailsChange(e.target.value)}
        placeholder="Composición, corte, cuidados, notas de estilo..."
      />
    </div>
  );
};
