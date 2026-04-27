
import { supabase } from '../supabase';
import type { Product } from '@/types';

// Importamos la función de normalización de productos
const normaliseProduct = (p: any): Product => ({
  ...p,
  is_published: p.is_published ?? true,
  images: p.images || [],
  variants: (p.product_variants || []).map((v: any) => ({
    ...v,
    id: v.variant_id.toString(),
  })),
  category: p.categories?.name,
  subcategory: p.subcategories?.name,
});

export const favorites = {
  getByCustomer: async (customer_id: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('customer_favorites')
      .select('product:products(*, product_variants(*), categories(name), subcategories(name))')
      .eq('customer_id', customer_id);

    if (error) throw error;
    
    return (data || [])
      .filter(f => f.product)
      .map(f => normaliseProduct(f.product));
  },

  add: async (customer_id: string, product_id: string): Promise<void> => {
    const { error } = await supabase
      .from('customer_favorites')
      .upsert({ customer_id, product_id });

    if (error) throw error;
  },

  remove: async (customer_id: string, product_id: string): Promise<void> => {
    const { error } = await supabase
      .from('customer_favorites')
      .delete()
      .eq('customer_id', customer_id)
      .eq('product_id', product_id);

    if (error) throw error;
  }
};
