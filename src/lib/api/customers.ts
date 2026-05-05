
import { supabase } from '../supabase';
import type { Customer } from '@/types';

export const customers = {
  getAll: async (page = 1, pageSize = 20, searchTerm?: string): Promise<{ customers: Customer[], total: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('customers')
      .select('*, shipping_addresses(*)', { count: 'exact' });

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      customers: data || [],
      total: count || 0
    };
  },

  getById: async (id: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, shipping_addresses(*)')
      .eq('customer_id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  getByEmail: async (email: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, shipping_addresses(*)')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  create: async (customer: Omit<Customer, 'customer_id'>): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    const { favorites, addresses, paymentMethods, orders, ...rest } = updates as any;
    
    const { data, error } = await supabase
      .from('customers')
      .update(rest)
      .eq('customer_id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
