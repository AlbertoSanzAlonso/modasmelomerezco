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

export function orderShortId(orderId: string): string {
  const short = orderId.split('-')[0]?.trim().toUpperCase();
  return short || orderId.slice(0, 8).toUpperCase();
}

export function webSaleNote(orderId: string): string {
  return `Pedido #${orderShortId(orderId)}`;
}

export interface OnlineSaleOrderLine {
  product_id?: string | null;
  name?: string | null;
  quantity?: number | null;
  size?: string | null;
  color?: string | null;
  variant_id?: number | string | null;
  image_url?: string | null;
}

export interface OnlineSaleOrder {
  order_id: string;
  order_date?: string | null;
  order_status?: string | null;
  payment_status?: string | null;
  items?: OnlineSaleOrderLine[] | null;
}

export interface StockHistoryLine {
  id: number | string;
  variant_id: number | null;
  product_id: string | null;
  product_name: string;
  image_url: string | null;
  size: string;
  color_name: string | null;
  delta: number;
  resulting_stock: number | null;
  kind: StockMovementKind;
  note: string | null;
  created_at: string;
}

function isPaidOnlineOrder(order: OnlineSaleOrder): boolean {
  if (order.order_status === 'Cancelled') return false;
  const paymentStatus = String(order.payment_status ?? '').toLowerCase();
  if (paymentStatus === 'paid') return true;
  const status = order.order_status ?? '';
  return status === 'Paid' || status === 'Shipped' || status === 'Delivered';
}

function lineMatchesWebSale(
  movement: StockHistoryLine,
  orderId: string,
  item: OnlineSaleOrderLine
): boolean {
  if (movement.kind !== 'web_sale') return false;
  const short = orderShortId(orderId);
  if (!short || !(movement.note || '').toUpperCase().includes(short)) return false;

  const itemVariant =
    item.variant_id == null || item.variant_id === '' ? null : Number(item.variant_id);
  if (itemVariant != null && Number.isFinite(itemVariant) && movement.variant_id != null) {
    return Number(movement.variant_id) === itemVariant;
  }

  const sameProduct = Boolean(
    item.product_id && movement.product_id && movement.product_id === item.product_id
  );
  const sameSize =
    (movement.size || '').trim().toLowerCase() === (item.size || '').trim().toLowerCase();
  const qty = Math.abs(Math.trunc(Number(item.quantity) || 0));
  return sameProduct && sameSize && qty > 0 && Math.abs(movement.delta) === qty;
}

/** Ventas online cobradas que aún no tienen fila en el historial de stock. */
export function onlineSalesMissingFromHistory(
  movements: StockHistoryLine[],
  orders: OnlineSaleOrder[],
  search = ''
): StockHistoryLine[] {
  const pool = movements.filter((movement) => movement.kind === 'web_sale');
  const query = search.trim().toLowerCase();
  const rows: StockHistoryLine[] = [];

  for (const order of orders) {
    if (!order.order_id || !isPaidOnlineOrder(order)) continue;
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item, index) => {
      const qty = Math.trunc(Number(item.quantity) || 0);
      if (qty <= 0) return;
      const productName = item.name?.trim() || 'Producto';
      if (query && !productName.toLowerCase().includes(query)) return;

      const matchIndex = pool.findIndex((movement) =>
        lineMatchesWebSale(movement, order.order_id, item)
      );
      if (matchIndex >= 0) {
        pool.splice(matchIndex, 1);
        return;
      }

      const variantId =
        item.variant_id == null || item.variant_id === '' ? null : Number(item.variant_id);

      rows.push({
        id: `order-${order.order_id}-${index}`,
        variant_id: variantId != null && Number.isFinite(variantId) ? variantId : null,
        product_id: item.product_id ?? null,
        product_name: productName,
        image_url: item.image_url?.trim() || null,
        size: item.size?.trim() || '',
        color_name: item.color?.trim() || null,
        delta: -qty,
        resulting_stock: null,
        kind: 'web_sale',
        note: webSaleNote(order.order_id),
        created_at: order.order_date || new Date(0).toISOString(),
      });
    });
  }

  return rows;
}

export function mergeStockHistory(
  movements: StockHistoryLine[],
  onlineSales: StockHistoryLine[]
): StockHistoryLine[] {
  return [...movements, ...onlineSales].sort((a, b) => {
    const byDate = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (byDate !== 0) return byDate;
    return String(b.id).localeCompare(String(a.id));
  });
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
