import { supabase } from '../supabase';
import type { AppliedDiscount, DiscountCode, DiscountCodeInput, DiscountType } from '@/types';

export interface DiscountValidationResult {
  valid: boolean;
  message?: string;
  discount?: AppliedDiscount;
}

function isDiscountTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const text = `${error.message || ''} ${(error as { details?: string }).details || ''}`.toLowerCase();
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    text.includes('discount_codes') ||
    text.includes('product_discount_codes') ||
    text.includes('subcategory_discount_codes') ||
    text.includes('does not exist')
  );
}

export interface DiscountCartItem {
  product_id: string;
  subcategory_id?: number | null;
}

async function syncSubcategoryLinks(
  codeId: number,
  subcategoryIds?: number[]
): Promise<void> {
  if (subcategoryIds === undefined) return;
  try {
    await supabase.from('subcategory_discount_codes').delete().eq('discount_code_id', codeId);
    if (subcategoryIds.length > 0) {
      const { error } = await supabase.from('subcategory_discount_codes').insert(
        subcategoryIds.map((subcategory_id) => ({
          discount_code_id: codeId,
          subcategory_id,
        }))
      );
      if (error) throw error;
    }
  } catch (err) {
    console.warn('[subcategory_discount_codes] No se pudieron guardar subcategorías:', err);
  }
}

async function fetchSubcategoryIdsByCode(): Promise<Map<number, number[]>> {
  const { data, error } = await supabase
    .from('subcategory_discount_codes')
    .select('discount_code_id, subcategory_id');

  if (error) {
    if (isDiscountTableMissing(error)) return new Map();
    throw error;
  }

  const map = new Map<number, number[]>();
  for (const row of data || []) {
    const codeId = Number(row.discount_code_id);
    const list = map.get(codeId) || [];
    list.push(Number(row.subcategory_id));
    map.set(codeId, list);
  }
  return map;
}

function normalizeCodeInput(code: string): string {
  return code.trim().toUpperCase();
}

function isCodeCurrentlyValid(row: DiscountCode, now: Date): string | null {
  if (!row.is_active) return 'Este código de descuento no está activo.';
  if (row.starts_at && new Date(row.starts_at) > now) {
    return 'Este código de descuento aún no está disponible.';
  }
  if (row.expires_at && new Date(row.expires_at) < now) {
    return 'Este código de descuento ha caducado.';
  }
  if (row.max_uses != null && row.used_count >= row.max_uses) {
    return 'Este código de descuento ya no tiene usos disponibles.';
  }
  return null;
}

function mapRow(
  row: Record<string, unknown>,
  subcategoryIds?: number[]
): DiscountCode {
  return {
    id: row.id as number,
    code: row.code as string,
    discount_type: row.discount_type as DiscountType,
    discount_value: Number(row.discount_value),
    is_active: Boolean(row.is_active),
    starts_at: (row.starts_at as string) ?? null,
    expires_at: (row.expires_at as string) ?? null,
    max_uses: row.max_uses != null ? Number(row.max_uses) : null,
    used_count: Number(row.used_count ?? 0),
    created_at: row.created_at as string | undefined,
    subcategory_ids: subcategoryIds,
  };
}

export const discountCodes = {
  getAll: async (): Promise<DiscountCode[]> => {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isDiscountTableMissing(error)) {
        console.warn(
          '[discountCodes] Tabla no encontrada. Ejecuta supabase/migrations/discount_codes.sql en Supabase.'
        );
        return [];
      }
      throw error;
    }
    const subMap = await fetchSubcategoryIdsByCode();
    return (data || []).map((row) =>
      mapRow(row as Record<string, unknown>, subMap.get(row.id as number))
    );
  },

  create: async (input: DiscountCodeInput): Promise<DiscountCode> => {
    const payload = {
      code: normalizeCodeInput(input.code),
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      is_active: input.is_active ?? true,
      starts_at: input.starts_at || null,
      expires_at: input.expires_at || null,
      max_uses: input.max_uses ?? null,
    };

    const { data, error } = await supabase
      .from('discount_codes')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (isDiscountTableMissing(error)) {
        throw new Error(
          'La tabla de descuentos no existe. Ejecuta supabase/migrations/discount_codes.sql en Supabase.'
        );
      }
      if (error.code === '23505') {
        throw new Error('Ya existe un código con ese nombre.');
      }
      throw error;
    }
    const created = mapRow(data);
    await syncSubcategoryLinks(created.id, input.subcategory_ids);
    if (input.subcategory_ids?.length) {
      created.subcategory_ids = input.subcategory_ids;
    }
    return created;
  },

  update: async (id: number, input: Partial<DiscountCodeInput>): Promise<DiscountCode> => {
    const payload: Record<string, unknown> = {};
    if (input.code !== undefined) payload.code = normalizeCodeInput(input.code);
    if (input.discount_type !== undefined) payload.discount_type = input.discount_type;
    if (input.discount_value !== undefined) payload.discount_value = input.discount_value;
    if (input.is_active !== undefined) payload.is_active = input.is_active;
    if (input.starts_at !== undefined) payload.starts_at = input.starts_at || null;
    if (input.expires_at !== undefined) payload.expires_at = input.expires_at || null;
    if (input.max_uses !== undefined) payload.max_uses = input.max_uses;

    const { data, error } = await supabase
      .from('discount_codes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isDiscountTableMissing(error)) {
        throw new Error(
          'La tabla de descuentos no existe. Ejecuta supabase/migrations/discount_codes.sql en Supabase.'
        );
      }
      if (error.code === '23505') {
        throw new Error('Ya existe un código con ese nombre.');
      }
      throw error;
    }
    const updated = mapRow(data);
    await syncSubcategoryLinks(id, input.subcategory_ids);
    if (input.subcategory_ids !== undefined) {
      updated.subcategory_ids = input.subcategory_ids;
    } else {
      const subMap = await fetchSubcategoryIdsByCode();
      updated.subcategory_ids = subMap.get(id);
    }
    return updated;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) {
      if (isDiscountTableMissing(error)) {
        throw new Error(
          'La tabla de descuentos no existe. Ejecuta supabase/migrations/discount_codes.sql en Supabase.'
        );
      }
      throw error;
    }
  },

  validateForProducts: async (
    rawCode: string,
    cartItems: DiscountCartItem[]
  ): Promise<DiscountValidationResult> => {
    const code = rawCode.trim();
    if (!code) {
      return { valid: false, message: 'Introduce un código de descuento.' };
    }
    if (cartItems.length === 0) {
      return { valid: false, message: 'Añade productos al carrito antes de aplicar un descuento.' };
    }

    const { data: rows, error } = await supabase
      .from('discount_codes')
      .select('*')
      .ilike('code', code)
      .limit(1);

    if (error) {
      if (isDiscountTableMissing(error)) {
        console.warn(
          '[discountCodes] Tablas no encontradas. Ejecuta supabase/migrations/discount_codes.sql en Supabase.'
        );
        return { valid: false, message: 'Descuento no válido' };
      }
      throw error;
    }

    const row = rows?.[0] ? mapRow(rows[0] as Record<string, unknown>) : undefined;
    if (!row) {
      return { valid: false, message: 'Descuento no válido' };
    }

    const now = new Date();
    const inactiveReason = isCodeCurrentlyValid(row, now);
    if (inactiveReason) {
      return { valid: false, message: 'Descuento no válido' };
    }

    const { data: productLinks, error: linkError } = await supabase
      .from('product_discount_codes')
      .select('product_id')
      .eq('discount_code_id', row.id);

    if (linkError) {
      if (isDiscountTableMissing(linkError)) {
        return { valid: false, message: 'Descuento no válido' };
      }
      throw linkError;
    }

    const { data: subLinks, error: subLinkError } = await supabase
      .from('subcategory_discount_codes')
      .select('subcategory_id')
      .eq('discount_code_id', row.id);

    if (subLinkError && !isDiscountTableMissing(subLinkError)) {
      throw subLinkError;
    }

    const linkedProductIds = new Set((productLinks || []).map((l) => String(l.product_id)));
    const linkedSubcategoryIds = new Set(
      (subLinks || []).map((l) => Number(l.subcategory_id))
    );

    const eligible = [
      ...new Set(
        cartItems
          .filter(
            (item) =>
              linkedProductIds.has(item.product_id) ||
              (item.subcategory_id != null &&
                linkedSubcategoryIds.has(item.subcategory_id))
          )
          .map((item) => item.product_id)
      ),
    ];

    if (eligible.length === 0) {
      return { valid: false, message: 'Descuento no válido' };
    }

    return {
      valid: true,
      discount: {
        code: row.code,
        discount_code_id: row.id,
        discount_type: row.discount_type,
        discount_value: Number(row.discount_value),
        eligible_product_ids: eligible,
      },
    };
  },
};
