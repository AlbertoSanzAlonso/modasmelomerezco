import type { Order } from '../types/index.js';

type OrderPaymentFields = Pick<Order, 'order_status' | 'payment_status'>;

/** Pago confirmado (webhook Redsys u otro). */
export function isOrderPaid(order: OrderPaymentFields): boolean {
  const paymentStatus = String(order.payment_status ?? '').toLowerCase();
  if (paymentStatus === 'paid') return true;
  const status = order.order_status ?? '';
  return status === 'Paid' || status === 'Shipped' || status === 'Delivered';
}

/** Listo para preparar envío (etiqueta Nacex, etc.). */
export function canFulfillOrder(order: OrderPaymentFields): boolean {
  if (order.order_status === 'Cancelled') return false;
  return isOrderPaid(order);
}
