import { supabase } from '../supabase';
import { getColorDisplayName } from '../productVariants';
import {
  isMissingStockMovementsTable,
  mergeStockHistory,
  onlineSalesMissingFromHistory,
  type OnlineSaleOrder,
  type StockHistoryLine,
  type StockMovementKind,
} from '../stockMovementLog';

export type { StockMovementKind };

export type StockMovement = StockHistoryLine;

export type StockMovementFilter = 'all' | 'sales' | 'entries';

export interface StockMovementList {
  movements: StockMovement[];
  total: number;
  unavailable: boolean;
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '');
}

const MOVEMENT_BATCH = 1000;
const MOVEMENT_CAP = 5000;

async function loadStoredMovements(
  filter: StockMovementFilter,
  search: string
): Promise<{ movements: StockMovement[]; unavailable: boolean }> {
  const movements: StockMovement[] = [];

  for (let offset = 0; offset < MOVEMENT_CAP; offset += MOVEMENT_BATCH) {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter === 'sales') query = query.in('kind', ['sale', 'web_sale']);
    if (filter === 'entries') query = query.eq('kind', 'entry');
    if (search) query = query.ilike('product_name', `%${search}%`);

    const { data, error } = await query.range(offset, offset + MOVEMENT_BATCH - 1);
    if (error) {
      if (isMissingStockMovementsTable(error)) {
        return { movements: [], unavailable: true };
      }
      throw error;
    }

    const batch = (data ?? []) as StockMovement[];
    movements.push(...batch);
    if (batch.length < MOVEMENT_BATCH) break;
  }

  return { movements, unavailable: false };
}

async function loadPaidOrders(): Promise<OnlineSaleOrder[]> {
  const columns = 'order_id, order_date, order_status, payment_status, items';
  const [byStatus, byPayment] = await Promise.all([
    supabase
      .from('orders')
      .select(columns)
      .in('order_status', ['Paid', 'Shipped', 'Delivered'])
      .order('order_date', { ascending: false })
      .limit(1000),
    supabase
      .from('orders')
      .select(columns)
      .in('payment_status', ['Paid', 'paid'])
      .order('order_date', { ascending: false })
      .limit(1000),
  ]);

  const rows = new Map<string, OnlineSaleOrder>();
  for (const result of [byStatus, byPayment]) {
    if (result.error) {
      console.warn('[stock_movements] No se pudieron leer pedidos online:', result.error.message);
      continue;
    }
    for (const row of (result.data ?? []) as OnlineSaleOrder[]) {
      if (row.order_id) rows.set(row.order_id, row);
    }
  }
  return [...rows.values()];
}

interface ProductImageRow {
  product_id: string;
  image_url: string | null;
  orden: number | null;
  colors?: { name?: string | null } | { name?: string | null }[] | null;
}

function joinedColorName(row: ProductImageRow): string {
  const color = Array.isArray(row.colors) ? row.colors[0] : row.colors;
  return color?.name?.trim() || '';
}

function pickProductImage(
  images: ProductImageRow[],
  colorName: string | null,
  productName: string
): string | null {
  const usable = images
    .filter((image) => image.image_url?.trim())
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  if (usable.length === 0) return null;

  const wanted = colorName?.trim().toLowerCase();
  if (wanted) {
    const wantedDisplay = getColorDisplayName(colorName || '', productName).trim().toLowerCase();
    const match = usable.find((image) => {
      const stored = joinedColorName(image);
      if (!stored) return false;
      const storedDisplay = getColorDisplayName(stored, productName).trim().toLowerCase();
      return stored.toLowerCase() === wanted || storedDisplay === wantedDisplay;
    });
    if (match?.image_url) return match.image_url.trim();
  }

  return usable[0].image_url?.trim() || null;
}

/** Rellena miniaturas que se guardaron antes de tener foto (altas antiguas). */
async function fillMissingMovementImages(
  movements: StockMovement[]
): Promise<StockMovement[]> {
  const productIds = [
    ...new Set(
      movements
        .filter((movement) => !movement.image_url?.trim() && movement.product_id)
        .map((movement) => movement.product_id as string)
    ),
  ];
  if (productIds.length === 0) return movements;

  const { data, error } = await supabase
    .from('product_images')
    .select('product_id, image_url, orden, colors(name)')
    .in('product_id', productIds);

  if (error || !data?.length) return movements;

  const byProduct = new Map<string, ProductImageRow[]>();
  for (const row of data as ProductImageRow[]) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row);
    byProduct.set(row.product_id, list);
  }

  return movements.map((movement) => {
    if (movement.image_url?.trim() || !movement.product_id) return movement;
    const imageUrl = pickProductImage(
      byProduct.get(movement.product_id) ?? [],
      movement.color_name,
      movement.product_name
    );
    return imageUrl ? { ...movement, image_url: imageUrl } : movement;
  });
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
    const search = escapeIlike(params?.search?.trim() ?? '');
    const includeOnline = filter !== 'entries';

    const [{ movements, unavailable }, orders] = await Promise.all([
      loadStoredMovements(filter, search),
      includeOnline ? loadPaidOrders() : Promise.resolve([]),
    ]);

    const online = includeOnline
      ? onlineSalesMissingFromHistory(movements, orders, search)
      : [];
    const merged = mergeStockHistory(movements, online);
    const page = await fillMissingMovementImages(merged.slice(offset, offset + limit));

    return {
      movements: page,
      total: merged.length,
      unavailable: unavailable && merged.length === 0,
    };
  },

  /** Último movimiento, para poder deshacer una venta o entrada reciente. */
  latest: async (): Promise<StockMovement | null> => {
    const { movements } = await stockMovements.list({ limit: 1, offset: 0 });
    return movements[0] ?? null;
  },
};
