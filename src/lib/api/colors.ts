import { supabase } from '../supabase';
import type { Color } from '@/types';

export type ColorInput = {
  name: string;
  hex: string;
  /** Muestra de estampado (opcional) */
  swatch_url?: string | null;
  /** Si se indica, el color solo existe para ese artículo */
  product_id?: string | null;
};

export const colors = {
  /** Catálogo global legacy (product_id null). Preferir getForProduct en el modal. */
  getAll: async (): Promise<Color[]> => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .is('product_id', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /** Colores disponibles para un artículo (propios + ya usados en sus variantes). */
  getForProduct: async (productId: string): Promise<Color[]> => {
    const { data: owned, error: ownedError } = await supabase
      .from('colors')
      .select('*')
      .eq('product_id', productId)
      .order('name', { ascending: true });

    if (ownedError) throw ownedError;

    const { data: variantRows, error: variantError } = await supabase
      .from('product_variants')
      .select('color_id')
      .eq('product_id', productId)
      .not('color_id', 'is', null);

    if (variantError) throw variantError;

    const ownedList = owned || [];
    const ownedIds = new Set(ownedList.map((c) => c.id));
    const missingIds = [
      ...new Set(
        (variantRows || [])
          .map((r) => r.color_id as number)
          .filter((id) => id != null && !ownedIds.has(id))
      ),
    ];

    if (missingIds.length === 0) return ownedList;

    const { data: extras, error: extrasError } = await supabase
      .from('colors')
      .select('*')
      .in('id', missingIds);

    if (extrasError) throw extrasError;

    const map = new Map<number, Color>();
    for (const c of [...ownedList, ...(extras || [])]) map.set(c.id, c);
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  },

  create: async (color: ColorInput): Promise<Color> => {
    const payload = {
      name: color.name.trim(),
      hex: color.hex,
      swatch_url: color.swatch_url ?? null,
      product_id: color.product_id ?? null,
    };

    const { data, error } = await supabase
      .from('colors')
      .insert([payload])
      .select()
      .single();

    if (error?.code === '23505') {
      let existingQuery = supabase
        .from('colors')
        .select('*')
        .ilike('name', payload.name);

      if (payload.product_id) {
        existingQuery = existingQuery.eq('product_id', payload.product_id);
      } else {
        existingQuery = existingQuery.is('product_id', null);
      }

      const { data: existing } = await existingQuery.maybeSingle();
      if (existing) return existing;
    }

    if (error) throw error;
    return data;
  },

  deleteForProduct: async (productId: string): Promise<void> => {
    const { error } = await supabase
      .from('colors')
      .delete()
      .eq('product_id', productId);
    if (error) throw error;
  },
};
