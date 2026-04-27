
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Order } from '@/types';

export const orders = {
  getAll: async (page = 1, pageSize = 20): Promise<Order[]> => {
    const offset = (page - 1) * pageSize;
    // Items are stored in a JSONB column, so no join needed for order_items.
    // Joining with customers table to get contact info.
    const response = await fetch(`${INSFORGE_URL}/api/database/records/orders?select=*,customer:customer_id(name,surname,email,phone)&order=order_date.desc&limit=${pageSize}&offset=${offset}`, { headers });
    const data = await handleResponse(response);
    return data.map((order: any) => ({
      ...order,
      // items is already a JSONB column in the orders table
      items: order.items || [],
      customer: order.customer ? {
        name: order.customer.name,
        surname: order.customer.surname,
        email: order.customer.email,
        phone: order.customer.phone
      } : undefined
    }));
  },
  getByCustomer: async (idOrEmail: string, page = 1, pageSize = 20): Promise<Order[]> => {
    const offset = (page - 1) * pageSize;
    // Dual search: find orders by customer_id OR customer_email for maximum reliability
    const isEmail = idOrEmail.includes('@');
    const query = isEmail 
      ? `customer_email=eq.${idOrEmail}`
      : `customer_id=eq.${idOrEmail}`;
    
    const response = await fetch(`${INSFORGE_URL}/api/database/records/orders?${query}&select=*,customer:customer_id(name,surname,email,phone)&order=order_date.desc&limit=${pageSize}&offset=${offset}`, { headers });
    const data = await handleResponse(response);
    return data.map((order: any) => ({
      ...order,
      items: order.items || [],
      customer: order.customer ? {
        name: order.customer.name,
        surname: order.customer.surname,
        email: order.customer.email,
        phone: order.customer.phone
      } : undefined
    }));
  },
  create: async (order: Omit<Order, 'order_id'>): Promise<Order> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/orders`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(order)
    });
    const data = await handleResponse(response);
    return data[0];
  },
  update: async (order_id: string, updates: Partial<Order>): Promise<Order> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/orders?order_id=eq.${order_id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(updates)
    });
    const data = await handleResponse(response);
    return data[0];
  }
};
