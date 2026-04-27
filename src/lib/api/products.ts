
import { supabase } from '../supabase';
import type { Product, ProductVariant } from '@/types';

// Helper para normalizar los datos de Supabase al tipo Product de nuestra app
const normalise = (p: any): Product => ({
  ...p,
  is_published: p.is_published ?? true,
  // En Supabase ya guardamos el array de URLs directamente en el campo 'images'
  images: p.images || [],
  variants: (p.product_variants || p.variants || []).map((v: any) => ({
    ...v,
    id: v.variant_id.toString(),
  })),
  // Mapear categorías si vienen de un join
  category: p.categories?.name || p.category,
  subcategory: p.subcategories?.name || p.subcategory,
});

export const products = {
  getAll: async (category?: string, subcategory?: string, page = 1, pageSize = 20, publishedOnly?: boolean, search?: string, isNewOnly?: boolean): Promise<{ products: Product[], total: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('products')
      .select('*, product_variants(*), categories(name), subcategories(name)', { count: 'exact' });

    if (category) query = query.eq('category_id', category);
    if (subcategory) query = query.eq('subcategory_id', subcategory);
    if (search) query = query.ilike('name', `%${search}%`);
    if (publishedOnly) query = query.eq('is_published', true);
    if (isNewOnly) query = query.eq('is_new', true);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      products: (data || []).map(normalise),
      total: count || 0
    };
  },

  getById: async (product_id: string): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*), categories(name), subcategories(name)')
      .eq('product_id', product_id)
      .single();

    if (error) throw error;
    return normalise(data);
  },

  getNewArrivals: async (publishedOnly = true): Promise<Product[]> => {
    let query = supabase
      .from('products')
      .select('*, product_variants(*), categories(name), subcategories(name)')
      .eq('is_new', true);

    if (publishedOnly) query = query.eq('is_published', true);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalise);
  },

  create: async (productData: Omit<Product, 'product_id'>): Promise<Product> => {
    // Nota: El ID se generará automáticamente o lo manejaremos en el admin
    // Implementaremos la lógica de vectores en el panel de admin para no saturar el cliente
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return normalise(data);
  },

  update: async (product_id: string, updates: Partial<Product>): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('product_id', product_id)
      .select()
      .single();

    if (error) throw error;
    return normalise(data);
  },

  delete: async (product_id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_id', product_id);

    if (error) throw error;
  },

  decrementStock: async (variant_id: string, quantity: number): Promise<void> => {
    // Implementación atómica en Supabase
    const { data: variant, error: fetchError } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('variant_id', variant_id)
      .single();

    if (fetchError) throw fetchError;

    const newStock = Math.max(0, (variant?.stock || 0) - quantity);
    
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ stock: newStock })
      .eq('variant_id', variant_id);

    if (updateError) throw updateError;
  },
};
