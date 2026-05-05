
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

  create: async (email: string, status: 'pending' | 'active' = 'pending', confirmationToken?: string): Promise<Subscription> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        [{ email, status, confirmation_token: confirmationToken }],
        { onConflict: 'email' }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
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
    // 1. Buscar la suscripción por el token
    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select('email')
      .eq('confirmation_token', token)
      .maybeSingle();

    if (fetchError || !data) throw new Error('Token de confirmación no válido o expirado.');

    // 2. Marcar como activa y limpiar el token
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        confirmation_token: null,
        subscribed_at: new Date().toISOString()
      })
      .eq('email', data.email);

    if (updateError) throw updateError;
    return true;
  }
};
