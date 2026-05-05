
import { supabase } from '../supabase';

export const paymentMethods = {
  getByUser: async (customer_id: string) => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  create: async (method: any) => {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([method])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  setAllInactive: async (customer_id: string) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: false })
      .eq('customer_id', customer_id);

    if (error) throw error;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
