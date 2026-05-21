import type { Order, OrderItem } from '@/types';

export function orderItemHasDiscount(item: OrderItem): boolean {
  return getOrderItemLineDiscount(item) > 0.001;
}

export function getOrderItemOriginalUnit(item: OrderItem): number {
  return item.unit_price_original ?? item.price;
}

export function getOrderItemLineOriginal(item: OrderItem): number {
  return Math.round(getOrderItemOriginalUnit(item) * item.quantity * 100) / 100;
}

export function getOrderItemLineDiscount(item: OrderItem): number {
  if (item.line_discount != null) {
    return Math.round(item.line_discount * 100) / 100;
  }
  const diff = getOrderItemLineOriginal(item) - item.price * item.quantity;
  return Math.max(0, Math.round(diff * 100) / 100);
}

export function getOrderItemLineFinal(item: OrderItem): number {
  return Math.round(item.price * item.quantity * 100) / 100;
}

export function orderHasDiscount(order: Pick<Order, 'items' | 'discount_amount'>): boolean {
  return (
    (order.discount_amount ?? 0) > 0.001 ||
    (order.items ?? []).some(orderItemHasDiscount)
  );
}

export function getOrderDiscountAmount(order: Pick<Order, 'items' | 'discount_amount' | 'subtotal'>): number {
  if (order.discount_amount != null && order.discount_amount > 0) {
    return order.discount_amount;
  }
  const itemsDiscount = (order.items ?? []).reduce(
    (sum, item) => sum + getOrderItemLineDiscount(item),
    0
  );
  return Math.round(itemsDiscount * 100) / 100;
}

export function getOrderSubtotalAfterDiscount(order: Pick<Order, 'subtotal' | 'items' | 'discount_amount'>): number {
  const subtotal = order.subtotal ?? (order.items ?? []).reduce((s, i) => s + getOrderItemLineFinal(i), 0);
  const discount = getOrderDiscountAmount(order);
  return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
}
