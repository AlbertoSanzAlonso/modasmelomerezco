
import { supabase } from '../supabase';
import type { Order } from '@/types';

export const orders = {
  getAll: async (page = 1, pageSize = 20): Promise<{ orders: Order[], total: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('orders')
      .select('*, customer:customers(name, surname, email, phone)', { count: 'exact' })
      .order('order_date', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      orders: data || [],
      total: count || 0
    };
  },

  getByCustomer: async (
    idOrEmail: string,
    page = 1,
    pageSize = 20,
    email?: string
  ): Promise<Order[]> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const cleanEmail = (email || (idOrEmail.includes('@') ? idOrEmail : '')).toLowerCase().trim();
    const customerId = idOrEmail.includes('@') ? '' : idOrEmail;

    let query = supabase
      .from('orders')
      .select('*, customer:customers(name, surname, email, phone)');

    if (customerId && cleanEmail) {
      query = query.or(
        `customer_id.eq.${customerId},customer_email.ilike."${cleanEmail}"`
      );
    } else if (cleanEmail) {
      query = query.ilike('customer_email', cleanEmail);
    } else if (customerId) {
      query = query.eq('customer_id', customerId);
    } else {
      return [];
    }

    const { data, error } = await query
      .order('order_date', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data || [];
  },

  /**
   * Vincula pedidos hechos como invitado (mismo email, sin customer_id)
   * al perfil del cliente tras registro o login.
   */
  claimGuestOrdersByEmail: async (email: string, customerId: string): Promise<Order[]> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !customerId) return [];

    const { data: guestOrders, error: findError } = await supabase
      .from('orders')
      .select('*')
      .is('customer_id', null)
      .ilike('customer_email', cleanEmail)
      .order('order_date', { ascending: false });

    if (findError) throw findError;
    if (!guestOrders?.length) return [];

    const ids = guestOrders.map((o) => o.order_id);
    const { data, error } = await supabase
      .from('orders')
      .update({ customer_id: customerId })
      .in('order_id', ids)
      .select('*');

    if (error) throw error;
    return data?.length ? data : guestOrders.map((o) => ({ ...o, customer_id: customerId }));
  },

  getById: async (order_id: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(name, surname, email, phone)')
      .eq('order_id', order_id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  create: async (order: Omit<Order, 'order_id'>): Promise<Order> => {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  update: async (order_id: string, updates: Partial<Order>): Promise<Order> => {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('order_id', order_id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
