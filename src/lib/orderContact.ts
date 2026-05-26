import type { Order } from '@/types';

export function getOrderContact(order: Pick<
  Order,
  'customer' | 'customer_email' | 'guest_name' | 'guest_surname' | 'guest_phone'
>) {
  if (order.customer?.name || order.customer?.email) {
    return {
      name: [order.customer.name, order.customer.surname].filter(Boolean).join(' ').trim(),
      email: order.customer.email || order.customer_email || '',
      phone: order.customer.phone || '',
    };
  }
  return {
    name: [order.guest_name, order.guest_surname].filter(Boolean).join(' ').trim(),
    email: order.customer_email || '',
    phone: order.guest_phone || '',
  };
}
