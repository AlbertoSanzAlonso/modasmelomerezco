import React from 'react';
import type { OrderItem } from '@/types';
import {
  getOrderItemLineDiscount,
  getOrderItemLineFinal,
  getOrderItemLineOriginal,
  getOrderItemOriginalUnit,
  orderItemHasDiscount,
} from '@/lib/orderPricing';

interface OrderLinePricingProps {
  item: OrderItem;
  /** Mostrar desglose por unidad además del total de línea */
  showUnitDetail?: boolean;
  className?: string;
}

export const OrderLinePricing: React.FC<OrderLinePricingProps> = ({
  item,
  showUnitDetail = false,
  className = '',
}) => {
  const hasDiscount = orderItemHasDiscount(item);
  const lineOriginal = getOrderItemLineOriginal(item);
  const lineDiscount = getOrderItemLineDiscount(item);
  const lineFinal = getOrderItemLineFinal(item);
  const unitOriginal = getOrderItemOriginalUnit(item);

  if (!hasDiscount) {
    return (
      <div className={`text-right ${className}`}>
        <p className="text-sm font-black">{lineFinal.toFixed(2)}€</p>
        {showUnitDetail && item.quantity > 1 && (
          <p className="text-[9px] text-gray-400 font-bold">{item.price.toFixed(2)}€/ud</p>
        )}
      </div>
    );
  }

  return (
    <div className={`text-right space-y-1 ${className}`}>
      <div className="flex flex-col items-end gap-0.5 text-[10px]">
        <span className="text-gray-400 font-bold uppercase tracking-wider">
          Precio: <span className="tabular-nums">{lineOriginal.toFixed(2)}€</span>
        </span>
        <span className="text-primary font-bold uppercase tracking-wider">
          Descuento: <span className="tabular-nums">−{lineDiscount.toFixed(2)}€</span>
        </span>
      </div>
      <p className="text-sm font-black tabular-nums">{lineFinal.toFixed(2)}€</p>
      {showUnitDetail && (
        <p className="text-[9px] text-gray-400 font-bold tabular-nums">
          {unitOriginal.toFixed(2)}€ → {item.price.toFixed(2)}€/ud
        </p>
      )}
    </div>
  );
};
