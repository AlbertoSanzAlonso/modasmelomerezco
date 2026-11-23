import type { SupabaseClient } from '@supabase/supabase-js';

export type StockMovementKind = 'sale' | 'entry' | 'web_sale' | 'adjustment' | 'undo';

export interface StockMovementDraft {
  variant_id?: number | string | null;
  product_id?: string | null;
  product_name: string;
  image_url?: string | null;
  size?: string | null;
  color_name?: string | null;
  delta: number;
  resulting_stock: number;
  kind: StockMovementKind;
  note?: string | null;
}

export function isMissingStockMovementsTable(
  error: { code?: string; message?: string; details?: string } | null
): boolean {
  if (!error) return false;
  const text = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    text.includes('stock_movements') ||
    text.includes('does not exist')
  );
}

/** Registra movimientos. Si la tabla aún no existe, no interrumpe el ajuste de stock. */
export async function insertStockMovements(
  client: SupabaseClient,
  rows: StockMovementDraft[]
): Promise<void> {
  const payload = rows
    .map((row) => {
      const delta = Math.trunc(row.delta);
      const variantId =
        row.variant_id == null || row.variant_id === ''
          ? null
          : Number(row.variant_id);
      return {
        variant_id: variantId != null && Number.isFinite(variantId) ? variantId : null,
        product_id: row.product_id ?? null,
        product_name: row.product_name?.trim() || '',
        image_url: row.image_url?.trim() || null,
        size: row.size?.trim() || '',
        color_name: row.color_name?.trim() || null,
        delta,
        resulting_stock: Math.max(0, Math.trunc(row.resulting_stock)),
        kind: row.kind,
        note: row.note?.trim() || null,
      };
    })
    .filter((row) => row.delta !== 0);

  if (payload.length === 0) return;

  const { error } = await client.from('stock_movements').insert(payload);
  if (!error) return;

  if (isMissingStockMovementsTable(error)) {
    console.warn(
      '[stock_movements] Falta la tabla. Aplica supabase/migrations/stock_movements.sql en la base Postgres.'
    );
    return;
  }

  console.warn('[stock_movements] No se pudo guardar el historial:', error.message);
}
