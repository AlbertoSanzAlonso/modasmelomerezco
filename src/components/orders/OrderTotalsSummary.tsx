import React from 'react';
import type { Order } from '@/types';
import {
  getOrderDiscountAmount,
  getOrderSubtotalAfterDiscount,
  orderHasDiscount,
} from '@/lib/orderPricing';

interface OrderTotalsSummaryProps {
  order: Order;
  className?: string;
  /** Estilo compacto para modales oscuros/claros */
  variant?: 'default' | 'card';
}

export const OrderTotalsSummary: React.FC<OrderTotalsSummaryProps> = ({
  order,
  className = '',
  variant = 'default',
}) => {
  const hasDiscount = orderHasDiscount(order);
  const discountAmount = getOrderDiscountAmount(order);
  const subtotalBefore = order.subtotal ?? order.total_amount - (order.shipping_cost || 0);
  const subtotalAfter = getOrderSubtotalAfterDiscount(order);
  const shipping = order.shipping_cost ?? 0;

  const rowClass =
    variant === 'card'
      ? 'flex justify-between text-xs font-bold uppercase text-secondary/60'
      : 'flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={rowClass}>
        <span>Subtotal</span>
        <span className="tabular-nums">{subtotalBefore.toFixed(2)}€</span>
      </div>
      {hasDiscount && (
        <div className={rowClass}>
          <span>
            Descuento{order.discount_code ? ` (${order.discount_code})` : ''}
          </span>
          <span className="text-primary tabular-nums">−{discountAmount.toFixed(2)}€</span>
        </div>
      )}
      {hasDiscount && (
        <div className={rowClass}>
          <span>Subtotal con descuento</span>
          <span className="tabular-nums">{subtotalAfter.toFixed(2)}€</span>
        </div>
      )}
      <div className={rowClass}>
        <span>Envío</span>
        <span className="tabular-nums">{shipping.toFixed(2)}€</span>
      </div>
      {order.tax_amount != null && order.tax_amount > 0 && (
        <div className={rowClass}>
          <span>IVA</span>
          <span className="tabular-nums">{order.tax_amount.toFixed(2)}€</span>
        </div>
      )}
      <div
        className={
          variant === 'card'
            ? 'flex justify-between text-lg font-black uppercase text-secondary pt-3 border-t border-secondary/5'
            : 'flex justify-between text-sm font-black uppercase pt-2 border-t border-(--border-main)'
        }
      >
        <span>Total</span>
        <span className="text-primary tabular-nums">{order.total_amount.toFixed(2)}€</span>
      </div>
    </div>
  );
};
