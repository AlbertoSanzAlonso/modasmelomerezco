import { supabase } from '../supabase';
import {
  isMissingStockMovementsTable,
  type StockMovementKind,
} from '../stockMovementLog';

export type { StockMovementKind };

export interface StockMovement {
  id: number;
  variant_id: number | null;
  product_id: string | null;
  product_name: string;
  image_url: string | null;
  size: string;
  color_name: string | null;
  delta: number;
  resulting_stock: number;
  kind: StockMovementKind;
  note: string | null;
  created_at: string;
}

export type StockMovementFilter = 'all' | 'sales' | 'entries';

export interface StockMovementList {
  movements: StockMovement[];
  total: number;
  unavailable: boolean;
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '');
}

export const stockMovements = {
  list: async (params?: {
    filter?: StockMovementFilter;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<StockMovementList> => {
    const limit = params?.limit ?? 40;
    const offset = params?.offset ?? 0;
    const filter = params?.filter ?? 'all';

    let query = supabase
      .from('stock_movements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filter === 'sales') query = query.in('kind', ['sale', 'web_sale']);
    if (filter === 'entries') query = query.eq('kind', 'entry');

    const search = escapeIlike(params?.search?.trim() ?? '');
    if (search) query = query.ilike('product_name', `%${search}%`);

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      if (isMissingStockMovementsTable(error)) {
        return { movements: [], total: 0, unavailable: true };
      }
      throw error;
    }

    return {
      movements: (data ?? []) as StockMovement[],
      total: count ?? 0,
      unavailable: false,
    };
  },

  /** Último movimiento, para poder deshacer una venta o entrada reciente. */
  latest: async (): Promise<StockMovement | null> => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingStockMovementsTable(error)) return null;
      throw error;
    }

    return (data as StockMovement | null) ?? null;
  },
};
