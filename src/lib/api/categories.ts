
import { supabase } from '../supabase';
import type { Category, Subcategory } from '@/types';

export const categories = {
  getAll: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  getByName: async (name: string): Promise<Category | undefined> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', name)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
    return data || undefined;
  },

  getSubcategories: async (categoryId?: number): Promise<Subcategory[]> => {
    let query = supabase
      .from('subcategories')
      .select('*')
      .order('id', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  createCategory: async (name: string): Promise<Category> => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  createSubcategory: async (name: string, category_id: number): Promise<Subcategory> => {
    const { data, error } = await supabase
      .from('subcategories')
      .insert([{ name, category_id }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
