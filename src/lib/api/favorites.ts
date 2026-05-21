
import { supabase } from '../supabase';
import type { Product } from '@/types';
import { mapProductVariant } from './products';
import { deriveProductColors, hasColorVariants } from '../productVariants';
import type { Color } from '@/types';

const normaliseProduct = (p: any): Product => {
  const raw = p.product_variants || [];
  const variants = raw.map(mapProductVariant);
  let colors: Color[] = [];
  if (hasColorVariants(variants)) {
    const catalogById = new Map<number, Color>();
    for (const row of raw) {
      if (row.colors?.id) catalogById.set(row.colors.id, row.colors);
    }
    colors = deriveProductColors(variants, [...catalogById.values()]);
  }

  return {
    ...p,
    is_published: p.is_published ?? true,
    images: (() => {
      if (p.product_images?.length > 0) {
        return p.product_images
          .sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
          .map((img: any) => img.image_url);
      }
      return p.images || [];
    })(),
    variants,
    colors,
    category: p.categories?.name,
    subcategory: p.subcategories?.name,
  };
};

export const favorites = {
  getByCustomer: async (customer_id: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('customer_favorites')
      .select(
        'product:products(*, product_variants(*, colors(*)), product_images(*), categories(name), subcategories(name))'
      )
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
