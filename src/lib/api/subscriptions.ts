
import { supabase } from '../supabase';
import type { Subscription } from '@/types';

export const subscriptions = {
  getAll: async (page = 1, pageSize = 1000): Promise<{ subscriptions: Subscription[], total: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('subscribed_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      subscriptions: data || [],
      total: count || 0
    };
  },

  create: async (email: string, status: 'pending' | 'active' = 'pending', confirmation_token?: string): Promise<Subscription> => {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, status, confirmation_token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al procesar la suscripción');
    }

    const res = await response.json();
    return res.data;
  },

  update: async (email: string, updates: Partial<Subscription>): Promise<Subscription> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('email', email)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  getByToken: async (token: string): Promise<Subscription | null> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('confirmation_token', token)
      .maybeSingle();

    if (error) return null;
    return data;
  },

  confirm: async (token: string): Promise<boolean> => {
    const response = await fetch('/api/confirm-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al confirmar la suscripción');
    }

    return true;
  }
};
