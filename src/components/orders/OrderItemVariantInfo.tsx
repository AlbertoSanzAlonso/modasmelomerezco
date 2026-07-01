import React from 'react';
import { formatOrderItemColorLabel, normalizeSize } from '@/lib/productVariants';

interface OrderItemVariantInfoProps {
  size?: string;
  color?: string | null;
  quantity?: number;
  className?: string;
}

/** Talla y color como en la factura PDF (líneas separadas). */
export const OrderItemVariantInfo: React.FC<OrderItemVariantInfoProps> = ({
  size,
  color,
  quantity,
  className = '',
}) => {
  const colorLabel = formatOrderItemColorLabel(color);

  const sizeLabel = normalizeSize(size);

  return (
    <div
      className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 space-y-0.5 ${className}`}
    >
      <p className="text-primary">{sizeLabel ? `Talla: ${sizeLabel}` : 'Sin talla'}</p>
      <p className={colorLabel ? 'text-primary' : 'text-gray-400'}>
        Color: {colorLabel ?? '-'}
      </p>
      {quantity != null && (
        <p className="text-gray-400 font-black">Cantidad: {quantity}</p>
      )}
    </div>
  );
};
