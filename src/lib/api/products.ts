
import { supabase } from '../supabase';
import type { Product } from '@/types';

// Helper para normalizar los datos de Supabase al tipo Product de nuestra app
const normalise = (p: any): Product => ({
  ...p,
  is_published: p.is_published ?? true,
  // Priorizar tabla relacional sobre columna JSON
  images: (() => {
    if (p.product_images && p.product_images.length > 0) {
      return p.product_images
        .sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
        .map((img: any) => img.image_url);
    }
    return p.images || [];
  })(),
  variants: (() => {
    const rawVariants = (p.product_variants && p.product_variants.length > 0) 
      ? p.product_variants 
      : (p.variants || []);
    return rawVariants.map((v: any) => ({
      ...v,
      id: (v.variant_id || v.id || Math.random().toString()).toString(),
    }));
  })(),
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
      .select('*, product_variants(*), product_images(*), categories(name), subcategories(name)', { count: 'exact' });

    if (category) query = query.eq('category_id', category);
    if (subcategory) query = query.eq('subcategory_id', subcategory);
    if (search) query = query.ilike('name', `%${search}%`);
    if (publishedOnly !== undefined) query = query.eq('is_published', publishedOnly);
    if (isNewOnly !== undefined) query = query.eq('is_new', isNewOnly);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .order('product_id', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      products: (data || []).map(normalise),
      total: count || 0
    };
  },

  getSiblings: async (productId: string, categoryId?: string, subcategoryId?: string): Promise<{ nextId: string | null, prevId: string | null }> => {
    // Fetch all IDs in order to find siblings (simplest way to ensure correct sorting logic)
    let query = supabase
      .from('products')
      .select('product_id')
      .eq('is_published', true);

    if (categoryId) query = query.eq('category_id', categoryId);
    if (subcategoryId) query = query.eq('subcategory_id', subcategoryId);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('product_id', { ascending: true });

    if (error) throw error;

    const ids = data.map(p => p.product_id);
    const currentIndex = ids.indexOf(productId);

    return {
      prevId: currentIndex > 0 ? ids[currentIndex - 1] : null,
      nextId: currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null
    };
  },

  getById: async (product_id: string): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*), categories(name), subcategories(name)')
      .eq('product_id', product_id)
      .single();

    if (error) throw error;
    return normalise(data);
  },

  getNewArrivals: async (publishedOnly = true): Promise<Product[]> => {
    let query = supabase
      .from('products')
      .select('*, product_variants(*), product_images(*), categories(name), subcategories(name)')
      .eq('is_new', true);

    if (publishedOnly !== undefined) query = query.eq('is_published', publishedOnly);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalise);
  },

  create: async (productData: Omit<Product, 'product_id'>): Promise<Product> => {
    const { variants, images, ...pData } = productData as any;
    
    // 1. Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert([pData])
      .select()
      .single();

    if (error) throw error;

    // 2. Create variants if any
    if (variants && variants.length > 0) {
      const cleanVariants = variants.map((v: any) => ({
        product_id: product.product_id,
        size: v.size,
        color: v.color || 'Único',
        stock: v.stock || 0
      }));
      await supabase.from('product_variants').insert(cleanVariants);
    }

    // 3. Create images if any
    if (images && images.length > 0) {
      const imageRecords = images.map((url: string, index: number) => ({
        product_id: product.product_id,
        image_url: url,
        orden: index,
        is_main: index === 0
      }));
      await supabase.from('product_images').insert(imageRecords);
    }

    return normalise(product);
  },

  update: async (product_id: string, updates: Partial<Product>): Promise<Product> => {
    const { variants, images, ...pUpdates } = updates as any;

    // 1. Update product table
    const validColumns = [
      'name', 'description', 'price', 'is_published', 'is_new', 'stock',
      'category_id', 'subcategory_id'
    ];
    const filteredUpdates = Object.fromEntries(
      Object.entries(pUpdates).filter(([key]) => validColumns.includes(key))
    );
    
    const { data: product, error } = await supabase
      .from('products')
      .update(filteredUpdates)
      .eq('product_id', product_id)
      .select()
      .single();

    if (error) throw error;

    // 2. Update variants if provided
    if (variants) {
      // Simplest: Delete and re-insert (common in small scale admin panels)
      await supabase.from('product_variants').delete().eq('product_id', product_id);
      if (variants.length > 0) {
        const cleanVariants = variants.map((v: any) => ({
          product_id,
          size: v.size,
          color: v.color || 'Único',
          stock: v.stock || 0
        }));
        await supabase.from('product_variants').insert(cleanVariants);
      }
    }

    // 3. Update images if provided
    if (images) {
      await supabase.from('product_images').delete().eq('product_id', product_id);
      if (images.length > 0) {
        const imageRecords = images.map((url: string, index: number) => ({
          product_id,
          image_url: url,
          orden: index,
          is_main: index === 0
        }));
        await supabase.from('product_images').insert(imageRecords);
      }
    }

    return normalise(product);
  },

  delete: async (product_id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_id', product_id);

    if (error) throw error;
  },

  decrementStock: async (variant_id: string, quantity: number): Promise<void> => {
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
