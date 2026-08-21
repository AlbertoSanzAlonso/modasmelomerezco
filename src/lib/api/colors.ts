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

  /**
   * Catálogo seleccionable para un artículo:
   * - colores propios (product_id = artículo)
   * - colores genéricos (product_id null)
   * - extras ya usados en variantes (legacy)
   */
  getForProduct: async (productId: string): Promise<Color[]> => {
    const [{ data: owned, error: ownedError }, { data: globals, error: globalsError }] =
      await Promise.all([
        supabase
          .from('colors')
          .select('*')
          .eq('product_id', productId)
          .order('name', { ascending: true }),
        supabase
          .from('colors')
          .select('*')
          .is('product_id', null)
          .order('name', { ascending: true }),
      ]);

    if (ownedError) throw ownedError;
    if (globalsError) throw globalsError;

    const { data: variantRows, error: variantError } = await supabase
      .from('product_variants')
      .select('color_id')
      .eq('product_id', productId)
      .not('color_id', 'is', null);

    if (variantError) throw variantError;

    const map = new Map<number, Color>();
    for (const c of [...(owned || []), ...(globals || [])]) {
      if (c?.id != null) map.set(Number(c.id), { ...c, id: Number(c.id) });
    }

    const missingIds = [
      ...new Set(
        (variantRows || [])
          .map((r) => Number(r.color_id))
          .filter((id) => Number.isInteger(id) && !map.has(id))
      ),
    ];

    if (missingIds.length > 0) {
      const { data: extras, error: extrasError } = await supabase
        .from('colors')
        .select('*')
        .in('id', missingIds);
      if (extrasError) throw extrasError;
      for (const c of extras || []) {
        if (c?.id != null) map.set(Number(c.id), { ...c, id: Number(c.id) });
      }
    }

    return [...map.values()].sort((a, b) => {
      const aOwn = a.product_id === productId ? 0 : 1;
      const bOwn = b.product_id === productId ? 0 : 1;
      if (aOwn !== bOwn) return aOwn - bOwn;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
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

  /**
   * Elimina un color del catálogo.
   * Primero quita vínculos de este artículo (variantes + product_colors).
   * Si sigue usado en otros productos (genérico), falla con mensaje claro.
   */
  delete: async (
    colorId: number,
    options?: { productId?: string }
  ): Promise<void> => {
    const id = Number(colorId);
    if (!Number.isInteger(id)) {
      throw new Error('Color no válido.');
    }

    const { error: bridgeError } = await supabase
      .from('product_colors')
      .delete()
      .eq('color_id', id);
    if (bridgeError) throw bridgeError;

    if (options?.productId) {
      const { error: variantsError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', options.productId)
        .eq('color_id', id);
      if (variantsError) throw variantsError;
    }

    const { count, error: countError } = await supabase
      .from('product_variants')
      .select('variant_id', { count: 'exact', head: true })
      .eq('color_id', id);
    if (countError) throw countError;

    if ((count ?? 0) > 0) {
      throw new Error(
        'Este color genérico sigue usándose en otros productos. Quítalo de esos artículos antes de eliminarlo.'
      );
    }

    const { error } = await supabase.from('colors').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'No se puede eliminar: el color sigue referenciado en la base de datos.'
        );
      }
      throw error;
    }
  },

  deleteForProduct: async (productId: string): Promise<void> => {
    const { error } = await supabase
      .from('colors')
      .delete()
      .eq('product_id', productId);
    if (error) throw error;
  },
};
