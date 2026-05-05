
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

  getByCustomer: async (idOrEmail: string, page = 1, pageSize = 20): Promise<Order[]> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const isEmail = idOrEmail.includes('@');

    let query = supabase
      .from('orders')
      .select('*, customer:customers(name, surname, email, phone)');

    if (isEmail) {
      query = query.or(`customer_email.eq.${idOrEmail},customer_id.eq.${idOrEmail}`);
    } else {
      query = query.eq('customer_id', idOrEmail);
    }

    const { data, error } = await query
      .order('order_date', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data || [];
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
