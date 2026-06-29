
import { supabase } from '../supabase';
import type { Product } from '@/types';
import {
  deriveProductColors,
  hasColorVariants,
  normalizeColor,
} from '../productVariants';
import type { Color, ProductVariant } from '@/types';

const PRODUCT_SELECT_BASE =
  '*, product_variants(*, colors(*)), product_images(*), categories(name), subcategories(name), product_colors(colors(*))';

export function mapProductVariant(v: any): ProductVariant {
  const colorId = v.color_id ?? null;
  const legacyName =
    v.color != null && String(v.color).trim() !== ''
      ? normalizeColor(v.color)
      : null;
  const joinedName = v.colors?.name?.trim() || null;
  const colorName =
    colorId != null
      ? joinedName ||
        (legacyName && legacyName !== 'Neutro' ? legacyName : null)
      : null;

  return {
    ...v,
    id: (v.variant_id || v.id || Math.random().toString()).toString(),
    variant_id: v.variant_id,
    size: v.size ?? '',
    color_id: colorId,
    color: colorName,
    stock: v.stock ?? 0,
  };
}

const PRODUCT_SELECT_WITH_LABELS = `${PRODUCT_SELECT_BASE}, product_labels(labels(*))`;

const PRODUCT_SELECT_WITH_DISCOUNTS = `${PRODUCT_SELECT_BASE}, product_discount_codes(discount_codes(*))`;

const PRODUCT_SELECT_FULL = `${PRODUCT_SELECT_BASE}, product_labels(labels(*)), product_discount_codes(discount_codes(*))`;

const PRODUCT_SELECT_FILTER_BY_LABEL = `${PRODUCT_SELECT_BASE}, product_labels!inner(labels(*))`;

const PRODUCT_TABLE_COLUMNS = new Set([
  'product_id',
  'name',
  'description',
  'price',
  'is_published',
  'is_new',
  'category_id',
  'subcategory_id',
]);

function cleanProductTablePayload(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) => PRODUCT_TABLE_COLUMNS.has(key) && value !== undefined
    )
  );
}

function createProductId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function assertNoSupabaseError(
  error: { message?: string; code?: string } | null,
  context: string
): void {
  if (!error) return;
  throw new Error(`[${context}] ${error.message || 'Error de Supabase'}`);
}

function isMissingRelation(
  error: { code?: string; message?: string } | null,
  relation: string
): boolean {
  if (!error) return false;
  const text = `${error.message || ''} ${(error as { details?: string }).details || ''}`.toLowerCase();
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    text.includes(relation.toLowerCase()) ||
    text.includes('does not exist')
  );
}

async function syncProductLabels(
  productId: string,
  labels?: { id: number }[]
): Promise<void> {
  if (!labels) return;
  try {
    await supabase.from('product_labels').delete().eq('product_id', productId);
    if (labels.length > 0) {
      const { error } = await supabase.from('product_labels').insert(
        labels.map((l) => ({ product_id: productId, label_id: l.id }))
      );
      if (error) throw error;
    }
  } catch (err) {
    console.warn('[product_labels] No se pudieron guardar etiquetas:', err);
  }
}

async function syncProductDiscountCodes(
  productId: string,
  discountCodes?: { id: number }[]
): Promise<void> {
  if (!discountCodes) return;
  try {
    await supabase.from('product_discount_codes').delete().eq('product_id', productId);
    if (discountCodes.length > 0) {
      const { error } = await supabase.from('product_discount_codes').insert(
        discountCodes.map((d) => ({ product_id: productId, discount_code_id: d.id }))
      );
      if (error) throw error;
    }
  } catch (err) {
    console.warn('[product_discount_codes] No se pudieron guardar códigos:', err);
  }
}

// Helper para normalizar los datos de Supabase al tipo Product de nuestra app
const normalise = (p: any): Product => ({
  ...p,
  is_published: p.is_published ?? true,
  stock: (() => {
    const rawVariants =
      p.product_variants?.length > 0 ? p.product_variants : p.variants || [];
    if (rawVariants.length > 0) {
      return rawVariants.reduce(
        (sum: number, v: { stock?: number | null }) => sum + (v.stock ?? 0),
        0
      );
    }
    return p.stock ?? 0;
  })(),
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
    const rawVariants =
      p.product_variants?.length > 0 ? p.product_variants : p.variants || [];
    return rawVariants.map(mapProductVariant);
  })(),
  colors: (() => {
    const fromBridge: Color[] =
      p.product_colors?.map((pc: any) => pc.colors).filter(Boolean) || [];
    if (fromBridge.length > 0) return fromBridge;
    const raw = p.product_variants || [];
    const mapped = raw.map(mapProductVariant);
    if (!hasColorVariants(mapped)) return [];
    const catalogById = new Map<number, Color>();
    for (const row of raw) {
      if (row.colors?.id) catalogById.set(row.colors.id, row.colors);
    }
    return deriveProductColors(mapped, [...catalogById.values()]);
  })(),
  labels: p.product_labels?.map((pl: any) => pl.labels).filter(Boolean) || [],
  discountCodes:
    p.product_discount_codes?.map((pdc: any) => pdc.discount_codes).filter(Boolean) || [],
  // Mapear categorías si vienen de un join
  category: p.categories?.name || p.category,
  subcategory: p.subcategories?.name || p.subcategory,
});

export const products = {
  getAll: async (
    category?: string,
    subcategory?: string,
    page = 1,
    pageSize = 20,
    publishedOnly?: boolean,
    search?: string,
    isNewOnly?: boolean,
    labelId?: number
  ): Promise<{ products: Product[], total: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const selects = labelId
      ? [PRODUCT_SELECT_FILTER_BY_LABEL, PRODUCT_SELECT_BASE]
      : [PRODUCT_SELECT_WITH_LABELS, PRODUCT_SELECT_BASE];

    let lastError: typeof selects extends never[] ? never : object | null = null;

    for (const select of selects) {
      let query = supabase.from('products').select(select, { count: 'exact' });

      if (category) query = query.eq('category_id', category);
      if (subcategory) query = query.eq('subcategory_id', subcategory);
      if (search) query = query.ilike('name', `%${search}%`);
      if (publishedOnly !== undefined) query = query.eq('is_published', publishedOnly);
      if (isNewOnly !== undefined) query = query.eq('is_new', isNewOnly);
      if (labelId && select.includes('product_labels')) {
        query = query.eq('product_labels.label_id', labelId);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .order('product_id', { ascending: true })
        .range(from, to);

      if (!error) {
        return {
          products: (data || []).map(normalise),
          total: count || 0,
        };
      }

      lastError = error;
      if (!isMissingRelation(error, 'product_labels')) break;
    }

    if (labelId && isMissingRelation(lastError as { code?: string; message?: string }, 'product_labels')) {
      console.warn('[labels] Filtro por etiqueta ignorado: ejecuta supabase/migrations/labels.sql');
      return { products: [], total: 0 };
    }

    throw lastError;
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
    const selects = [
      PRODUCT_SELECT_FULL,
      PRODUCT_SELECT_WITH_LABELS,
      PRODUCT_SELECT_WITH_DISCOUNTS,
      PRODUCT_SELECT_BASE,
    ];
    let lastError: { code?: string; message?: string } | null = null;

    for (const select of selects) {
      const { data, error } = await supabase
        .from('products')
        .select(select)
        .eq('product_id', product_id)
        .maybeSingle();

      if (!error) return normalise(data);
      lastError = error;
      if (
        !isMissingRelation(error, 'product_labels') &&
        !isMissingRelation(error, 'product_discount_codes')
      ) {
        throw error;
      }
    }
    if (lastError) throw lastError;
    throw new Error('Producto no encontrado');
  },

  getNewArrivals: async (publishedOnly = true): Promise<Product[]> => {
    for (const select of [PRODUCT_SELECT_WITH_LABELS, PRODUCT_SELECT_BASE]) {
      let query = supabase.from('products').select(select).eq('is_new', true);
      if (publishedOnly !== undefined) query = query.eq('is_published', publishedOnly);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error) return (data || []).map(normalise);
      if (!isMissingRelation(error, 'product_labels')) throw error;
    }
    return [];
  },

  syncEmbedding: async (productId: string, name: string, description: string, categoryId?: string): Promise<void> => {
    try {
      let categoryName = '';
      if (categoryId) {
        const { data: cat } = await supabase
          .from('categories')
          .select('name')
          .eq('id', categoryId)
          .maybeSingle();
        categoryName = cat?.name || '';
      }

      const content = `Producto: ${name}. Categoría: ${categoryName}. Descripción: ${description || ''}`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'embed', input: content }),
      });

      if (!response.ok) {
        console.warn('[embedding] OpenAI:', response.status, await response.text());
        return;
      }

      const json = await response.json();
      const embedding = json?.data?.[0]?.embedding;
      if (!embedding) {
        console.warn('[embedding] Respuesta OpenAI sin vector');
        return;
      }

      const { error: deleteErr } = await supabase
        .from('product_embeddings')
        .delete()
        .eq('product_id', productId);

      if (deleteErr && !isMissingRelation(deleteErr, 'product_embeddings')) {
        console.warn('[embedding] delete:', deleteErr.message);
      }

      const { error: insertErr } = await supabase.from('product_embeddings').insert({
        product_id: productId,
        content,
        embedding,
      });

      if (insertErr) {
        console.warn(
          '[embedding] No se guardó en Supabase (el producto sí se guardó):',
          insertErr.message
        );
        return;
      }

      console.log(`Embedding synced for ${name}`);
    } catch (err) {
      console.warn('[embedding] Error no crítico:', err);
    }
  },

  create: async (productData: Omit<Product, 'product_id'>): Promise<Product> => {
    const { variants, images, colors, labels, discountCodes, ...pData } = productData as any;
    const productPayload = cleanProductTablePayload({
      product_id: createProductId(),
      ...pData,
    });
    
    // 1. Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert([productPayload])
      .select()
      .maybeSingle();

    if (error) throw error;

    // 2. Create variants if any
    if (variants && variants.length > 0) {
      const cleanVariants = variants.map((v: any) => ({
        product_id: product.product_id,
        size: v.size,
        color_id: v.color_id ?? null,
        stock: v.stock || 0,
      }));
      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(cleanVariants);
      assertNoSupabaseError(variantsError, 'product_variants insert');
    }

    // 3. Create images if any
    if (images && images.length > 0) {
      const imageRecords = images.map((url: string, index: number) => ({
        product_id: product.product_id,
        image_url: url,
        orden: index,
        is_main: index === 0
      }));
      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageRecords);
      assertNoSupabaseError(imagesError, 'product_images insert');
    }

    // 4. Create color associations if any
    if (colors && colors.length > 0) {
      const colorRecords = colors.map((c: any) => ({
        product_id: product.product_id,
        color_id: c.id
      }));
      const { error: colorsError } = await supabase
        .from('product_colors')
        .insert(colorRecords);
      assertNoSupabaseError(colorsError, 'product_colors insert');
    }

    await syncProductLabels(product.product_id, labels);
    await syncProductDiscountCodes(product.product_id, discountCodes);

    // 6. Sync Embedding (Background)
    products.syncEmbedding(product.product_id, product.name, product.description, product.category_id);

    return products.getById(product.product_id);
  },

  update: async (product_id: string, updates: Partial<Product>): Promise<Product> => {
    const { variants, images, colors, labels, discountCodes, ...pUpdates } = updates as any;

    // 1. Update product table
    const filteredUpdates = cleanProductTablePayload(pUpdates);
    
    const { data: product, error } = await supabase
      .from('products')
      .update(filteredUpdates)
      .eq('product_id', product_id)
      .select()
      .maybeSingle();

    if (error) throw error;

    // 2. Update variants if provided
    if (variants) {
      const { error: deleteVariantsError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', product_id);
      assertNoSupabaseError(deleteVariantsError, 'product_variants delete');
      if (variants.length > 0) {
        const cleanVariants = variants.map((v: any) => ({
          product_id,
          size: v.size,
          color_id: v.color_id ?? null,
          stock: v.stock || 0,
        }));
        const { error: insertVariantsError } = await supabase
          .from('product_variants')
          .insert(cleanVariants);
        assertNoSupabaseError(insertVariantsError, 'product_variants insert');
      }
    }

    // 3. Update images if provided
    if (images) {
      const { error: deleteImagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', product_id);
      assertNoSupabaseError(deleteImagesError, 'product_images delete');
      if (images.length > 0) {
        const imageRecords = images.map((url: string, index: number) => ({
          product_id,
          image_url: url,
          orden: index,
          is_main: index === 0
        }));
        const { error: insertImagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);
        assertNoSupabaseError(insertImagesError, 'product_images insert');
      }
    }

    // 4. Update colors if provided
    if (colors) {
      const { error: deleteColorsError } = await supabase
        .from('product_colors')
        .delete()
        .eq('product_id', product_id);
      assertNoSupabaseError(deleteColorsError, 'product_colors delete');
      if (colors.length > 0) {
        const colorRecords = colors.map((c: any) => ({
          product_id,
          color_id: c.id
        }));
        const { error: insertColorsError } = await supabase
          .from('product_colors')
          .insert(colorRecords);
        assertNoSupabaseError(insertColorsError, 'product_colors insert');
      }
    }

    await syncProductLabels(product_id, labels);
    await syncProductDiscountCodes(product_id, discountCodes);

    // 6. Sync Embedding (Background) - Solo si cambió nombre, descripción o categoría
    if (updates.name || updates.description || updates.category_id) {
      products.syncEmbedding(product.product_id, product.name, product.description, product.category_id);
    }

    return products.getById(product_id);
  },

  delete: async (product_id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_id', product_id);

    if (error) throw error;
    // El embedding se borra solo por CASCADE en la DB
  },

  decrementStock: async (variant_id: string, quantity: number): Promise<void> => {
    const { data: variant, error: fetchError } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('variant_id', variant_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const newStock = Math.max(0, (variant?.stock || 0) - quantity);
    
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ stock: newStock })
      .eq('variant_id', variant_id);

    if (updateError) throw updateError;
  },
};
