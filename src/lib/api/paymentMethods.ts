
import { supabase } from '../supabase';

export const paymentMethods = {
  getByUser: async (user_id: string) => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  create: async (method: any) => {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([method])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  setAllInactive: async (user_id: string) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: false })
      .eq('user_id', user_id);

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
