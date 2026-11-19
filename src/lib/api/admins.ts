import { supabase } from '../supabase';
import type { Admin } from '@/types';

export const admins = {
  getByEmail: async (email: string): Promise<Admin | null> => {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  update: async (admin_id: string, updates: Partial<Admin> & { password?: string }): Promise<Admin> => {
    const dataToUpdate: Record<string, unknown> = { ...updates };
    
    if (updates.password) {
      const { default: bcrypt } = await import('bcryptjs');
      dataToUpdate.password = bcrypt.hashSync(updates.password, 10);
    }

    const { data, error } = await supabase
      .from('admins')
      .update(dataToUpdate)
      .eq('admin_id', admin_id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};
