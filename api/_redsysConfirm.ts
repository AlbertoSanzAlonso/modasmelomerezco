import crypto from 'node:crypto';
import type { VercelRequest } from '@vercel/node';
import CryptoJS from 'crypto-js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderItem } from '../src/types/index.js';
import {
  sendAdminPaymentFailedEmail,
  sendOrderPaidEmails,
} from '../src/lib/emails/adminNewOrderNotification.js';
import { isOrderPaid } from '../src/lib/orderPayment.js';

export interface RedsysRawPayload {
  merchantParameters: string;
  signature: string;
}

export type RedsysConfirmResult =
  | { status: 'missing_params' }
  | { status: 'config_error' }
  | { status: 'invalid_signature'; orderUuid: string | null }
  | { status: 'payment_failed'; responseCode: number; orderUuid: string | null }
  | { status: 'order_not_found'; orderUuid: string }
  | { status: 'already_paid'; orderUuid: string }
  | { status: 'skipped'; orderUuid: string; currentStatus: string }
  | { status: 'confirmed'; orderUuid: string };

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }
  return null;
}

function parseBodyIfNeeded(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return {};
    if (trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        return {};
      }
    }
    const params = new URLSearchParams(trimmed);
    const out: Record<string, unknown> = {};
    for (const [k, v] of params.entries()) out[k] = v;
    return out;
  }
  if (typeof body === 'object') {
    return body as Record<string, unknown>;
  }
  return {};
}

export function extractRedsysMerchantParameters(req: VercelRequest): string | null {
  const body = parseBodyIfNeeded(req.body);
  const query = (req.query ?? {}) as Record<string, unknown>;

  return (
    firstString(body.Ds_MerchantParameters) ||
    firstString(body.DS_MERCHANTPARAMETERS) ||
    firstString(query.Ds_MerchantParameters) ||
    firstString(query.DS_MERCHANTPARAMETERS)
  );
}

export function extractRedsysPayload(req: VercelRequest): RedsysRawPayload | null {
  const body = parseBodyIfNeeded(req.body);
  const query = (req.query ?? {}) as Record<string, unknown>;

  const merchantParameters = extractRedsysMerchantParameters(req);

  const signature =
    firstString(body.Ds_Signature) ||
    firstString(body.DS_SIGNATURE) ||
    firstString(query.Ds_Signature) ||
    firstString(query.DS_SIGNATURE);

  if (!merchantParameters || !signature) return null;
  return { merchantParameters, signature };
}

export function decodeRedsysMerchantParameters(merchantParamsB64: string): Record<string, unknown> {
  let normalized = merchantParamsB64
    .trim()
    .replace(/ /g, '+')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }
  const json = Buffer.from(normalized, 'base64').toString('utf8');
  return JSON.parse(json) as Record<string, unknown>;
}

export function extractOrderUuidFromParams(params: Record<string, unknown>): string | null {
  const raw =
    firstString(params.Ds_MerchantData) ||
    firstString(params.DS_MERCHANTDATA);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim() || null;
  } catch {
    return raw.trim() || null;
  }
}

function normalizeSignature(sig: string): string {
  return sig
    .trim()
    .replace(/ /g, '+')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function computeExpectedSignature(
  merchantParamsB64: string,
  orderIdNumeric: string,
  secretKey: string
): string {
  const key = CryptoJS.enc.Base64.parse(secretKey);
  const iv = CryptoJS.enc.Hex.parse('0000000000000000');
  const cipher = CryptoJS.TripleDES.encrypt(orderIdNumeric, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding,
  });

  const localKey = cipher.ciphertext;
  const expectedSignature = CryptoJS.HmacSHA256(merchantParamsB64, localKey);
  return normalizeSignature(CryptoJS.enc.Base64.stringify(expectedSignature));
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyRedsysSignature(
  merchantParamsB64: string,
  providedSignature: string,
  orderIdNumeric: string,
  secretKey: string
): boolean {
  const provided = normalizeSignature(providedSignature);
  const candidates = new Set<string>([
    merchantParamsB64,
    merchantParamsB64.replace(/ /g, '+'),
  ]);

  for (const candidate of candidates) {
    const expected = computeExpectedSignature(candidate, orderIdNumeric, secretKey);
    if (safeEqual(provided, expected)) return true;
  }

  return false;
}

async function decrementVariantStock(
  supabase: SupabaseClient,
  variantId: string | number,
  quantity: number
): Promise<void> {
  if (!variantId || !Number.isFinite(quantity) || quantity <= 0) return;

  const { error: rpcError } = await supabase.rpc('decrement_stock', {
    p_variant_id: variantId,
    p_quantity: quantity,
  });

  if (!rpcError) return;

  // Fallback directo si el RPC no está disponible o falla
  console.warn('[redsys-confirm] RPC decrement_stock falló, usando actualización directa:', rpcError.message);

  const { data: variant, error: fetchError } = await supabase
    .from('product_variants')
    .select('stock, product_id')
    .eq('variant_id', variantId)
    .maybeSingle();

  if (fetchError || !variant) {
    console.error('[redsys-confirm] No se pudo leer variante para descontar stock:', variantId, fetchError);
    return;
  }

  const newStock = Math.max(0, (variant.stock || 0) - Math.trunc(quantity));
  const { error: updateError } = await supabase
    .from('product_variants')
    .update({ stock: newStock })
    .eq('variant_id', variantId);

  if (updateError) {
    console.error('[redsys-confirm] Error actualizando stock de variante:', variantId, updateError);
    return;
  }

  if (newStock === 0 && variant.product_id) {
    const { data: allVariants } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('product_id', variant.product_id);

    const totalStock = (allVariants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
    if (totalStock <= 0) {
      await supabase
        .from('products')
        .update({ is_sold_out: true })
        .eq('product_id', variant.product_id);
    }
  }
}

async function resolveOrderItemsForEmail(
  supabase: SupabaseClient,
  orderUuid: string,
  order: Order
): Promise<OrderItem[]> {
  const { data: tableItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderUuid);

  if (!itemsError && tableItems && tableItems.length > 0) {
    return tableItems as OrderItem[];
  }
  return Array.isArray(order.items) ? order.items : [];
}

/**
 * Envía el correo de "pago no completado" al admin una sola vez por pedido,
 * usando una transición atómica `payment_status: 'pending' -> 'failed'`
 * (dejando `order_status` en `'Pending'` para poder recuperar el pago luego).
 */
async function notifyAdminPaymentFailedIfFirst(
  supabase: SupabaseClient,
  orderUuid: string,
  responseCode: number | undefined,
  source: 'webhook' | 'return-ok' | 'return-ko'
): Promise<void> {
  const { data: order, error } = await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('order_id', orderUuid)
    .eq('order_status', 'Pending')
    .eq('payment_status', 'pending')
    .select('*, customer:customers(name, surname, email, phone)')
    .maybeSingle();

  if (error) {
    console.error(`[redsys-${source}] Error marcando intento fallido:`, error);
    return;
  }

  if (!order) {
    // Ya avisado previamente, ya pagado o no existe
    return;
  }

  const orderItems = await resolveOrderItemsForEmail(supabase, orderUuid, order as Order);
  const sent = await sendAdminPaymentFailedEmail(order as Order, orderItems, responseCode);
  if (sent) {
    console.log(`[redsys-${source}] Aviso de pago no completado enviado al admin:`, orderUuid);
  }
}

/**
 * Verifica una notificación/retorno firmado de Redsys y confirma el pedido
 * de forma atómica e idempotente (Pending → Paid + stock + emails).
 * Si el pago falla o se cancela (Ds_Response >= 100), envía un correo distinto
 * al admin una sola vez para poder abrir el pedido y mandar el enlace de pago.
 * Usado por /api/webhooks/redsys, /api/redsys/return-ok y /api/redsys/return-ko.
 */
export async function processRedsysPayment(
  req: VercelRequest,
  source: 'webhook' | 'return-ok' | 'return-ko'
): Promise<RedsysConfirmResult> {
  const payload = extractRedsysPayload(req);
  if (!payload) {
    return { status: 'missing_params' };
  }

  const secretKey = process.env.REDSYS_SECRET_KEY || process.env.VITE_REDSYS_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !supabaseUrl || !supabaseServiceKey) {
    console.error(`[redsys-${source}] Faltan variables de entorno de Redsys o Supabase`);
    return { status: 'config_error' };
  }

  let merchantParams: Record<string, unknown>;
  try {
    merchantParams = decodeRedsysMerchantParameters(payload.merchantParameters);
  } catch (error) {
    console.error(`[redsys-${source}] Ds_MerchantParameters malformado:`, error);
    return { status: 'missing_params' };
  }
  const orderIdNumeric =
    firstString(merchantParams.Ds_Order) ||
    firstString(merchantParams.DS_ORDER) ||
    '';
  const orderUuid = extractOrderUuidFromParams(merchantParams);

  if (
    !orderIdNumeric ||
    !verifyRedsysSignature(payload.merchantParameters, payload.signature, orderIdNumeric, secretKey)
  ) {
    console.error(`[redsys-${source}] Firma inválida de Redsys`, { orderIdNumeric, orderUuid });
    return { status: 'invalid_signature', orderUuid };
  }

  const responseRaw =
    firstString(merchantParams.Ds_Response) ||
    firstString(merchantParams.DS_RESPONSE) ||
    '';
  const responseCode = Number.parseInt(responseRaw, 10);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (!Number.isFinite(responseCode) || responseCode < 0 || responseCode > 99) {
    console.log(`[redsys-${source}] Pago no autorizado. Ds_Response:`, responseRaw, { orderUuid });
    if (orderUuid) {
      await notifyAdminPaymentFailedIfFirst(
        supabase,
        orderUuid,
        Number.isFinite(responseCode) ? responseCode : undefined,
        source
      );
    }
    return { status: 'payment_failed', responseCode, orderUuid };
  }

  if (!orderUuid) {
    console.error(`[redsys-${source}] Respuesta autorizada sin Ds_MerchantData (UUID)`);
    return { status: 'order_not_found', orderUuid: '' };
  }

  // Idempotencia atómica: solo transiciona Pending → Paid una vez.
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({ order_status: 'Paid', payment_status: 'Paid' })
    .eq('order_id', orderUuid)
    .eq('order_status', 'Pending')
    .select('*, customer:customers(name, surname, email, phone)')
    .maybeSingle();

  if (orderError) throw orderError;

  if (!order) {
    const { data: existing } = await supabase
      .from('orders')
      .select('order_id, order_status, payment_status')
      .eq('order_id', orderUuid)
      .maybeSingle();

    if (existing && isOrderPaid(existing)) {
      console.log(`[redsys-${source}] Pedido ya procesado:`, orderUuid);
      return { status: 'already_paid', orderUuid };
    }

    if (!existing) {
      console.error(`[redsys-${source}] Pedido no encontrado:`, orderUuid);
      return { status: 'order_not_found', orderUuid };
    }

    console.warn(`[redsys-${source}] Pedido en estado no procesable:`, orderUuid, existing);
    return { status: 'skipped', orderUuid, currentStatus: existing.order_status };
  }

  // Resolver artículos (tabla order_items o columna JSONB order.items)
  const { data: tableItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderUuid);

  const orderItems: OrderItem[] =
    !itemsError && tableItems && tableItems.length > 0
      ? tableItems
      : Array.isArray(order.items)
        ? order.items
        : [];

  for (const item of orderItems) {
    const variantId = (item as OrderItem & { variant_id?: string | number }).variant_id;
    const qty = Number(item.quantity || 0);
    if (variantId && qty > 0) {
      await decrementVariantStock(supabase, variantId, qty);
    }
  }

  // Emails cliente + admin en paralelo
  const emailResults = await sendOrderPaidEmails(order as Order, orderItems);
  if (!emailResults.admin) {
    console.error(`[redsys-${source}] No se pudo enviar el aviso al admin.`);
  }

  console.log(`[redsys-${source}] Pedido confirmado como Paid:`, orderUuid);
  return { status: 'confirmed', orderUuid };
}
