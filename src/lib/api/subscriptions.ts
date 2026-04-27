
import { supabase } from '../supabase';
import type { Subscription } from '@/types';

export const subscriptions = {
  getAll: async (): Promise<Subscription[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  create: async (email: string, status: 'pending' | 'active' = 'pending', confirmationToken?: string): Promise<Subscription> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{ email, status, confirmation_token: confirmationToken }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (email: string, updates: Partial<Subscription>): Promise<Subscription> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getByToken: async (token: string): Promise<Subscription | null> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (error) return null;
    return data;
  }
};
