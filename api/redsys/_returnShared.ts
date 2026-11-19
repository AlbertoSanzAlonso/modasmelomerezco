import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCanonicalSiteUrl } from '../_siteUrl.js';
import {
  decodeRedsysMerchantParameters,
  extractOrderUuidFromParams,
  extractRedsysMerchantParameters,
  processRedsysPayment,
} from '../_redsysConfirm.js';

/**
 * Redsys hace GET/POST a URLOK/URLKO. En una SPA eso puede dejar al usuario
 * “colgado” o perder query params al redirigir a rutas protegidas.
 * Además, en URLOK verificamos la firma HMAC-SHA256 de Redsys y confirmamos
 * el pedido como respaldo idempotente si el webhook servidor-a-servidor falló
 * (p. ej. bloqueo de Cloudflare/WAF o fallo temporal).
 */
function resolveOrigin(req: VercelRequest): string {
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostHeader = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host;
  const host = hostHeader?.split(',')[0]?.trim();
  const forwardedProto = req.headers['x-forwarded-proto'];
  let proto =
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(',')[0]?.trim() ||
    'https';

  if (!host || host.toLowerCase() === 'modasmelomerezco.es') {
    return getCanonicalSiteUrl();
  }

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    proto = 'http';
  }

  return `${proto}://${host}`.replace(/\/$/, '');
}

/** Extrae el UUID del pedido (Ds_MerchantData) del POST/GET de retorno de Redsys. */
function extractOrderUuidFromRedsysRequest(req: VercelRequest): string | null {
  try {
    const merchantParameters = extractRedsysMerchantParameters(req);
    if (!merchantParameters) return null;
    const params = decodeRedsysMerchantParameters(merchantParameters);
    return extractOrderUuidFromParams(params);
  } catch {
    return null;
  }
}

function redirectToConfirmation(
  req: VercelRequest,
  res: VercelResponse,
  payment: 'success' | 'pending',
  orderIdOverride?: string | null
) {
  const origin = resolveOrigin(req);
  const params = new URLSearchParams({ payment });
  const orderId = orderIdOverride ?? extractOrderUuidFromRedsysRequest(req);
  if (orderId) params.set('order', orderId);

  const location = `${origin}/pedido-confirmado?${params.toString()}`;
  res.statusCode = 303;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

export async function handleRedsysOk(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let confirmedOrderId: string | null = null;
  try {
    const result = await processRedsysPayment(req, 'return-ok');
    if ('orderUuid' in result && result.orderUuid) {
      confirmedOrderId = result.orderUuid;
    }
    if (result.status === 'payment_failed' || result.status === 'invalid_signature') {
      return redirectToConfirmation(req, res, 'pending', confirmedOrderId);
    }
  } catch (error) {
    console.error('[redsys-return-ok] Error confirmando pedido en retorno:', error);
  }

  return redirectToConfirmation(req, res, 'success', confirmedOrderId);
}

export async function handleRedsysKo(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let failedOrderId: string | null = null;
  try {
    const result = await processRedsysPayment(req, 'return-ko');
    if ('orderUuid' in result && result.orderUuid) {
      failedOrderId = result.orderUuid;
    }
  } catch (error) {
    console.error('[redsys-return-ko] Error procesando aviso de pago fallido:', error);
  }

  return redirectToConfirmation(req, res, 'pending', failedOrderId);
}
