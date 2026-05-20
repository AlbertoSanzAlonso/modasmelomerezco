import { supabase } from '../supabase';
import type { Color } from '@/types';

export const colors = {
  getAll: async (): Promise<Color[]> => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  create: async (color: Omit<Color, 'id'>): Promise<Color> => {
    const { data, error } = await supabase
      .from('colors')
      .insert([color])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
