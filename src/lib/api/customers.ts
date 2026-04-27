
import { supabase } from '../supabase';
import type { Customer } from '@/types';

export const customers = {
  getById: async (id: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, shipping_addresses(*)')
      .eq('customer_id', id)
      .single();

    if (error) throw error;
    return data;
  },

  getByEmail: async (email: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, shipping_addresses(*)')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (customer: Omit<Customer, 'customer_id'>): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    // Evitar campos que no existen en la tabla o que se manejan aparte
    const { favorites, addresses, paymentMethods, orders, ...rest } = updates as any;
    
    const { data, error } = await supabase
      .from('customers')
      .update(rest)
      .eq('customer_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
